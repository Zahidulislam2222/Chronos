<?php
declare(strict_types=1);

namespace ChronosBridge\Tests\Unit;

use ChronosBridge\Configuration\Runtime;
use PHPUnit\Framework\TestCase;

final class RuntimeConfigurationTest extends TestCase {
    private string $directory;

    protected function setUp(): void {
        $this->directory = sys_get_temp_dir() . '/chronos-runtime-' . bin2hex(random_bytes(8));
        mkdir($this->directory . '/content', 0700, true);
    }

    protected function tearDown(): void {
        if (is_file($this->directory . '/content/runtime.php')) {
            unlink($this->directory . '/content/runtime.php');
        }
        rmdir($this->directory . '/content');
        rmdir($this->directory);
    }

    private function configure(mixed $value): void {
        file_put_contents($this->directory . '/content/runtime.php', '<?php return ' . var_export($value, true) . ';');
    }

    public function testStandardComposerInstallationKeepsItsConventionalDirectory(): void {
        $this->configure(['vendorDirectory' => 'vendor']);
        self::assertSame($this->directory . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php', Runtime::autoloader($this->directory));
    }

    public function testImmutableReleaseCanSelectADifferentSiblingDirectory(): void {
        $this->configure(['vendorDirectory' => 'vendor-sdk20-20261021']);
        self::assertSame($this->directory . DIRECTORY_SEPARATOR . 'vendor-sdk20-20261021' . DIRECTORY_SEPARATOR . 'autoload.php', Runtime::autoloader($this->directory));
    }

    public function testDeploymentCanSelectAnImmutableDirectoryOutsideTheWebRoot(): void {
        $directory = '/srv/apps/chronos-bridge/releases/20261021-sdk20/vendor';
        $this->configure(['vendorDirectory' => $directory]);
        self::assertSame($directory . DIRECTORY_SEPARATOR . 'autoload.php', Runtime::autoloader($this->directory));
    }

    public function testInvalidAndTraversalConfigurationCannotSelectOtherFiles(): void {
        foreach (['../vendor', '/tmp/../vendor', '/tmp/./vendor', '//host/vendor', 'https://example.invalid/vendor', 'vendor/other', 'C:\\vendor', '', false, ['vendor']] as $value) {
            $this->configure(['vendorDirectory' => $value]);
            try {
                Runtime::autoloader($this->directory);
                self::fail('Invalid runtime configuration was accepted');
            } catch (\UnexpectedValueException $error) {
                self::assertSame('Invalid Chronos runtime configuration.', $error->getMessage());
            }
        }
    }

    public function testMissingAndMalformedConfigurationFailExplicitly(): void {
        foreach ([null, ['unexpected' => 'vendor'], ['vendorDirectory' => 'vendor', 'extra' => true]] as $value) {
            $this->configure($value);
            try {
                Runtime::autoloader($this->directory);
                self::fail('Malformed runtime configuration was accepted');
            } catch (\UnexpectedValueException $error) {
                self::assertSame('Invalid Chronos runtime configuration.', $error->getMessage());
            }
        }
        unlink($this->directory . '/content/runtime.php');
        $this->expectException(\UnexpectedValueException::class);
        Runtime::autoloader($this->directory);
    }
}
