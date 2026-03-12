"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { toast } from "sonner";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { getStripeClient } from "@/lib/stripe-client";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

function brandLabel(brand: string) {
  const brands: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return brands[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setSaving(true);
    setError("");

    const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (confirmError) {
      setError(confirmError.message || "Failed to save card. Please try again.");
      setSaving(false);
      return;
    }

    toast.success("Payment method added");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
      <div className="rounded-md border border-neutral-200 p-3">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#171717",
                "::placeholder": { color: "#a3a3a3" },
              },
            },
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !stripe}
          className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Card"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/user/payment-methods");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMethods(data.paymentMethods);
    } catch {
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  async function handleAddCard() {
    setAddingCard(true);
    try {
      const res = await fetch("/api/user/payment-methods", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start setup");
      }
      setSetupClientSecret(data.clientSecret);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add payment method"
      );
    } finally {
      setAddingCard(false);
    }
  }

  function handleCardSaved() {
    setSetupClientSecret(null);
    fetchMethods();
  }

  async function handleRemove(paymentMethodId: string) {
    setRemovingId(paymentMethodId);
    try {
      const res = await fetch("/api/user/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove");
      }
      setMethods((prev) => prev.filter((m) => m.id !== paymentMethodId));
      toast.success("Payment method removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove payment method"
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSetDefault(paymentMethodId: string) {
    setSettingDefaultId(paymentMethodId);
    try {
      const res = await fetch("/api/user/payment-methods/default", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set default");
      }
      toast.success("Default payment method updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to set default"
      );
    } finally {
      setSettingDefaultId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-lg animate-pulse">
        <div className="h-6 w-48 rounded bg-neutral-200" />
        <div className="h-4 w-64 rounded bg-neutral-100" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-neutral-200 bg-neutral-50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Payment Methods
        </h3>
        <p className="text-sm text-neutral-500">
          Manage your saved cards for faster checkout.
        </p>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="text-sm text-neutral-500">
            No payment methods on file.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-xs font-bold text-neutral-600 uppercase">
                  {pm.brand.slice(0, 4)}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {brandLabel(pm.brand)} &middot;&middot;&middot;&middot; {pm.last4}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetDefault(pm.id)}
                  disabled={settingDefaultId === pm.id}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                >
                  {settingDefaultId === pm.id ? "Setting..." : "Set default"}
                </button>
                <button
                  onClick={() => handleRemove(pm.id)}
                  disabled={removingId === pm.id}
                  className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  {removingId === pm.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {setupClientSecret ? (
        <Elements
          stripe={getStripeClient()}
          options={{
            clientSecret: setupClientSecret,
            appearance: {
              theme: "stripe",
              variables: { borderRadius: "8px" },
            },
          }}
        >
          <AddCardForm
            clientSecret={setupClientSecret}
            onSuccess={handleCardSaved}
            onCancel={() => setSetupClientSecret(null)}
          />
        </Elements>
      ) : (
        <button
          onClick={handleAddCard}
          disabled={addingCard}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {addingCard ? "Setting up..." : "Add Payment Method"}
        </button>
      )}
    </div>
  );
}
