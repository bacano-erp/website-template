import { esES } from "@clerk/localizations";
import type { ClerkProviderProps } from "@clerk/react";
import { storeConfig } from "./store";

/**
 * Buyer accounts are optional and switched on per website in Bacano, never
 * here: Bacano sends the Clerk publishable key in the public configuration,
 * and with none the store runs guest-only. This file only says how the Clerk
 * screens read and look when a store has accounts.
 */
export const clerkLocalization = {
  ...esES,
  formFieldInputPlaceholder__password: "Ingresa tu contraseña",
  formFieldInputPlaceholder__signUpPassword: "Crea una contraseña",
  signIn: {
    ...esES.signIn,
    start: {
      ...esES.signIn?.start,
      title: "Inicia sesión",
      titleCombined: "Inicia sesión",
      subtitle: `para entrar a tu cuenta en ${storeConfig.name}`,
      subtitleCombined: `para entrar a tu cuenta en ${storeConfig.name}`,
      actionLink: "Crear cuenta",
      actionText: "¿Aún no tienes cuenta?",
    },
  },
  signUp: {
    ...esES.signUp,
    start: {
      ...esES.signUp?.start,
      title: "Crea tu cuenta",
      titleCombined: "Crea tu cuenta",
      subtitle: `para comprar y consultar tus pedidos en ${storeConfig.name}`,
      subtitleCombined: `para comprar y consultar tus pedidos en ${storeConfig.name}`,
      actionLink: "Iniciar sesión",
      actionText: "¿Ya tienes una cuenta?",
    },
  },
};

/**
 * Clerk's own theme, on purpose. Its variables take literal colours, not the
 * store's CSS tokens, so a palette written here would drift from the rest of
 * the site the first time someone restyles it. Set it per store when applying
 * the visual identity.
 */
export const clerkAppearance: NonNullable<ClerkProviderProps["appearance"]> =
  {};
