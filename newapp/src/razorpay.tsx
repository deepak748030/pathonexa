// Razorpay checkout — web uses the official checkout.js SDK; native (Expo Go)
// loads the same SDK inside a WebView and posts the result back via
// `ReactNativeWebView.postMessage`. The secret key never touches the client:
// the server creates the order and the app only opens the checkout with the
// publishable key + order id.
import React from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from './theme';

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; contact?: string; email?: string };
  themeColor?: string;
};

export type RazorpayPaymentResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { Razorpay?: any; }
}

let scriptPromise: Promise<boolean> | null = null;

function loadCheckoutScript(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

function openOnWeb(options: RazorpayCheckoutOptions): Promise<RazorpayPaymentResult> {
  return loadCheckoutScript().then((ready) => {
    if (!ready || !window.Razorpay) throw new Error('Razorpay checkout failed to load.');
    return new Promise<RazorpayPaymentResult>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: options.keyId,
        amount: options.amount,
        currency: options.currency,
        name: options.name,
        description: options.description || 'Report payment',
        order_id: options.orderId,
        prefill: options.prefill || {},
        theme: { color: options.themeColor || C.primary },
        handler: (response: RazorpayPaymentResult) => resolve(response),
        modal: {
          ondismiss: () => reject(Object.assign(new Error('Payment cancelled'), { name: 'AbortError' })),
        },
      });
      rzp.on('payment.failed', (response: { error?: { description?: string } }) => {
        reject(new Error(response?.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  });
}

function buildCheckoutHtml(options: RazorpayCheckoutOptions): string {
  const config = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description || 'Report payment',
    order_id: options.orderId,
    prefill: options.prefill || {},
    theme: { color: options.themeColor || C.primary },
  };
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body style="margin:0;background:#fff">
<script>
var options = ${JSON.stringify(config)};
options.handler = function (response) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', response: response }));
};
options.modal = { ondismiss: function () {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismiss' }));
} };
var rzp = new Razorpay(options);
rzp.on('payment.failed', function (response) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'failed', error: response.error && response.error.description }));
});
rzp.open();
</script>
</body>
</html>`;
}

/**
 * Opens the Razorpay checkout on web and resolves when payment completes
 * (or rejects on failure/dismiss). Native callers should render
 * `<RazorpayCheckout>` instead (it needs the WebView).
 */
export async function openRazorpayOnWeb(options: RazorpayCheckoutOptions): Promise<RazorpayPaymentResult> {
  return openOnWeb(options);
}

/**
 * Cross-platform checkout. On web it opens the SDK modal; on native it renders
 * a WebView that hosts the same checkout. `onSuccess` receives the raw
 * Razorpay response (payment_id / order_id / signature) for server verification.
 */
export function RazorpayCheckout({
  options,
  onSuccess,
  onClose,
}: {
  options: RazorpayCheckoutOptions;
  onSuccess: (result: RazorpayPaymentResult) => void;
  onClose: (error?: string) => void;
}) {
  if (Platform.OS === 'web') {
    React.useEffect(() => {
      let cancelled = false;
      openOnWeb(options)
        .then((result) => { if (!cancelled) onSuccess(result); })
        .catch(() => { if (!cancelled) onClose(); });
      return () => { cancelled = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  }

  return (
    <WebView
      source={{ html: buildCheckoutHtml(options), baseUrl: 'https://checkout.razorpay.com' }}
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'success') onSuccess(data.response as RazorpayPaymentResult);
          else onClose(data.error);
        } catch {
          onClose();
        }
      }}
      onError={() => onClose('Unable to load the payment page.')}
      style={{ flex: 1 }}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      originWhitelist={['*']}
    />
  );
}
