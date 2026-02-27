'use client';

export default function ToastNotification({ message }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-toast animate-fade-in
                    bg-baldur-blue/20 border border-baldur-blue/30 text-baldur-blue
                    px-4 py-2 rounded-input text-[13px] font-medium">
      ✓ {message}
    </div>
  );
}
