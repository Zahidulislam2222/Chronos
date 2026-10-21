ARG PYTHON_IMAGE
FROM ${PYTHON_IMAGE}
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.lock ./
RUN pip install --no-cache-dir --require-hashes -r requirements.lock
COPY pyproject.toml ./
COPY src ./src
RUN useradd --uid 10001 --create-home chronos && \
    mkdir /state && chown chronos:chronos /state
USER chronos
ENV PYTHONPATH=/app/src
ENTRYPOINT ["python", "-m", "chronos_inventory.server"]
