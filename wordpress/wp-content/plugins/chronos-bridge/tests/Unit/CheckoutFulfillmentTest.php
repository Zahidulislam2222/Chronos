<?php
declare(strict_types=1);
namespace ChronosBridge\Payment {
    final class FulfillmentFixture {
        public static ?self $order = null;
        public bool $paid = false;
        public bool $paymentResult = true;
        public bool $persistPayment = true;
        public int $calls = 0;
        public string $transaction = '';
        public function get_id(): int { return 1; }
        public function get_customer_id(): int { return 2; }
        public function get_meta(string $key): string { return $key === '_chronos_demo' ? 'yes' : 'test-session'; }
        public function get_total(): string { return '120.50'; }
        public function get_currency(): string { return 'BDT'; }
        public function is_paid(): bool { return $this->paid; }
        public function get_transaction_id(): string { return $this->transaction; }
        public function payment_complete(string $transaction): bool {
            ++$this->calls;
            if ($this->paymentResult && $this->persistPayment) { $this->paid=true; $this->transaction=$transaction; }
            return $this->paymentResult;
        }
    }
    function wc_get_order(int $id): ?FulfillmentFixture { return $id === 1 ? FulfillmentFixture::$order : null; }
    function wc_get_price_decimals(): int { return 2; }
}
namespace ChronosBridge\Tests\Unit {
    use ChronosBridge\Payment\CheckoutEndpoint;
    use ChronosBridge\Payment\FulfillmentFixture;
    use PHPUnit\Framework\TestCase;
    final class CheckoutFulfillmentTest extends TestCase {
        protected function setUp(): void { FulfillmentFixture::$order=new FulfillmentFixture(); }
        private function session(): object {return (object)['metadata'=>(object)['order_id'=>1,'user_id'=>2],'id'=>'test-session','payment_intent'=>'test-payment','livemode'=>false,'payment_status'=>'paid','amount_total'=>12050,'currency'=>'bdt'];}
        public function testPaidSessionIsAppliedOnce(): void {
            $session=$this->session();self::assertTrue(CheckoutEndpoint::fulfill($session));self::assertTrue(CheckoutEndpoint::fulfill($session));self::assertSame(1,FulfillmentFixture::$order->calls);
        }
        public function testPaymentFailureIsNotAcknowledged(): void {
            FulfillmentFixture::$order->paymentResult=false;self::assertFalse(CheckoutEndpoint::fulfill($this->session()));
        }
        public function testUnpersistedPaymentIsNotAcknowledged(): void {
            FulfillmentFixture::$order->persistPayment=false;self::assertFalse(CheckoutEndpoint::fulfill($this->session()));
        }
        public function testWrongCustomerCannotFulfillOrder(): void {
            $session=$this->session();$session->metadata->user_id=3;self::assertFalse(CheckoutEndpoint::fulfill($session));self::assertSame(0,FulfillmentFixture::$order->calls);
        }
        public function testProviderMismatchCannotFulfill(): void {
            foreach (['amount_total'=>1,'currency'=>'usd','livemode'=>true,'id'=>'unrelated-session','payment_status'=>'unpaid'] as $field=>$value) {
                $session=$this->session();$session->$field=$value;self::assertFalse(CheckoutEndpoint::fulfill($session),$field);
            }
            self::assertSame(0,FulfillmentFixture::$order->calls);
        }
    }
}
