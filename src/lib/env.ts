// Ortam değişkenlerini tek yerden, eksikse açık hata vererek okur.

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

// NEXT_PUBLIC_ değişkenleri derleme anında gömülür; bu yüzden tam adla okunmalı.
export const publicEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabasePublishableKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  },
};
