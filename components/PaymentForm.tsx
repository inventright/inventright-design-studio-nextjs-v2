import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

// Load Stripe (will use VITE_STRIPE_PUBLISHABLE_KEY from environment)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function CheckoutForm({ amount, onSuccess, onCancel }: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/dashboard",
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Total Amount:</span>
          <span className="text-2xl font-bold text-blue-900">
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <PaymentElement />
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-4 h-4" />
        <span>Secure payment powered by Stripe. Your payment information is encrypted.</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentForm({ clientSecret, amount, onSuccess, onCancel }: PaymentFormProps) {
  if (!stripePromise) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 font-medium">Stripe is not configured</p>
        <p className="text-sm text-gray-600 mt-2">
          Please contact support to enable payment processing.
        </p>
        <Button onClick={onCancel} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#3b82f6",
        colorBackground: "#ffffff",
        colorText: "#1f2937",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
