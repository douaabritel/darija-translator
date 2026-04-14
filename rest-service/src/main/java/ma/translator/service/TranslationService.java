package ma.translator.service;

/**
 * Interface for translation services.
 * Allows swapping between different LLM providers (Gemini, OpenAI, local models, etc.)
 */
public interface TranslationService {

    /**
     * Translates text from a source language to Moroccan Arabic Dialect (Darija).
     *
     * @param text           the text to translate
     * @param sourceLanguage the source language label (e.g., "English")
     * @return translated text in Darija
     * @throws TranslationException on any failure
     */
    String translate(String text, String sourceLanguage) throws TranslationException;
}
