import { I18nService } from 'nestjs-i18n';
import { I18nContext } from 'nestjs-i18n';

/**
 * Traduz uma chave de forma segura, retornando a mensagem padrão se houver erro
 * Tenta usar I18nContext primeiro (mais seguro), depois I18nService como fallback
 */
export async function safeTranslate(
  i18n: I18nService,
  key: string,
  options: { lang: string; defaultValue?: string },
): Promise<string> {
  // Primeiro, tenta usar I18nContext (mais seguro, não causa recursão)
  try {
    const i18nContext = I18nContext.current();
    if (i18nContext) {
      const result = i18nContext.t(key);
      if (result && result !== key && typeof result === 'string') {
        return result;
      }
    }
  } catch {
    // Se I18nContext não estiver disponível ou falhar, continua
  }

  // Fallback: tenta usar I18nService diretamente
  // Mas com timeout para evitar recursão infinita
  try {
    // Usa Promise.race para evitar recursão infinita
    const translatePromise = i18n.translate(key, { lang: options.lang });
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(options.defaultValue || key), 100);
    });

    const result = await Promise.race([translatePromise, timeoutPromise]);
    
    if (result && result !== key && typeof result === 'string') {
      return result;
    }
  } catch {
    // Se houver qualquer erro, retorna a mensagem padrão
  }

  // Último recurso: retorna a mensagem padrão
  return options.defaultValue || key;
}

