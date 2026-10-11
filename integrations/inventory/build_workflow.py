"""Generate the importable graph from maintained deployment/product settings."""

import json
from pathlib import Path
from typing import Any


def generate(config: dict[str, Any]) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = []

    def node(
        name: str,
        kind: str,
        version: float,
        params: dict[str, Any],
        x: int,
        y: int = 0,
        **extra: Any,
    ) -> None:
        nodes.append(
            {
                "id": name.replace(" ", ""),
                "name": name,
                "type": "n8n-nodes-base." + kind,
                "typeVersion": version,
                "position": [x, y],
                "parameters": params,
                **extra,
            }
        )

    def http(name: str, path: str, x: int, method: str = "POST", body: str = "={}") -> None:
        params: dict[str, Any] = {
            "method": method,
            "url": "={{ $('Pipeline settings').first().json.service_origin + " + path + " }}",
            "authentication": "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "options": {"timeout": config["request_timeout_ms"]},
        }
        if method == "POST":
            params.update({"sendBody": True, "specifyBody": "json", "jsonBody": body})
        node(
            name,
            "httpRequest",
            4.2,
            params,
            x,
            credentials={
                "httpHeaderAuth": {
                    "id": config["service_credential_id"],
                    "name": "Chronos inventory service",
                }
            },
        )

    node("Run catalog sync", "manualTrigger", 1, {}, 0)
    node(
        "Authenticated sync",
        "webhook",
        2,
        {
            "httpMethod": "POST",
            "path": config["webhook_path"],
            "authentication": "headerAuth",
            "responseMode": "responseNode",
            "options": {},
        },
        0,
        200,
        webhookId=config["workflow_id"],
        credentials={
            "httpHeaderAuth": {
                "id": config["intake_credential_id"],
                "name": "Chronos inventory intake",
            }
        },
    )
    node(
        "Pipeline settings",
        "set",
        3.4,
        {"mode": "raw", "jsonOutput": json.dumps(config), "options": {}},
        220,
    )
    http(
        "Read WooCommerce catalog",
        "$('Pipeline settings').first().json.source_path",
        440,
        body="{}",
    )
    node(
        "Catalog contains items",
        "if",
        2.2,
        {
            "conditions": {
                "options": {"caseSensitive": True, "typeValidation": "strict", "version": 2},
                "conditions": [
                    {
                        "id": "has-items",
                        "leftValue": "={{ $json.items.length > 0 }}",
                        "rightValue": "",
                        "operator": {"type": "boolean", "operation": "true", "singleValue": True},
                    }
                ],
                "combinator": "and",
            },
            "options": {},
        },
        660,
    )
    node(
        "Split product references",
        "splitOut",
        1,
        {"fieldToSplitOut": "items", "options": {"destinationFieldName": "item"}},
        880,
    )
    node("One product at a time", "splitInBatches", 3, {"batchSize": 1, "options": {}}, 1100)
    http(
        "Validate gallery and queue draft",
        "$('Pipeline settings').first().json.item_path",
        1320,
        body="={{ JSON.stringify($json.item) }}",
    )
    http(
        "Batch summary",
        "$('Pipeline settings').first().json.summary_path + "
        "$('Read WooCommerce catalog').first().json.batch_id",
        1320,
        method="GET",
    )
    node(
        "Sync response",
        "respondToWebhook",
        1.4,
        {"respondWith": "json", "responseBody": "={{ $json }}", "options": {}},
        1540,
    )
    links: dict[str, Any] = {}

    def connect(source: str, target: str, output: int = 0) -> None:
        outputs = links.setdefault(source, {"main": []})["main"]
        while len(outputs) <= output:
            outputs.append([])
        outputs[output].append({"node": target, "type": "main", "index": 0})

    for source in ("Run catalog sync", "Authenticated sync"):
        connect(source, "Pipeline settings")
    connect("Pipeline settings", "Read WooCommerce catalog")
    connect("Read WooCommerce catalog", "Catalog contains items")
    connect("Catalog contains items", "Split product references")
    connect("Catalog contains items", "Sync response", 1)
    connect("Split product references", "One product at a time")
    connect("One product at a time", "Batch summary")
    connect("One product at a time", "Validate gallery and queue draft", 1)
    connect("Validate gallery and queue draft", "One product at a time")
    connect("Batch summary", "Sync response")
    return {
        "id": config["workflow_id"],
        "name": config["name"],
        "active": False,
        "nodes": nodes,
        "connections": links,
        "settings": {
            "executionOrder": "v1",
            "executionTimeout": config["execution_timeout_seconds"],
        },
        "pinData": {},
    }


if __name__ == "__main__":
    root = Path(__file__).parent
    config = json.loads((root / "workflow-settings.json").read_text())
    (root / "workflow.json").write_text(json.dumps(generate(config), indent=2) + "\n")
