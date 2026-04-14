package ma.translator;

import ma.translator.model.TranslationRequest;
import ma.translator.model.TranslationResponse;
import ma.translator.resource.TranslatorResource;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TranslatorResource.
 * Note: Integration tests (actual LLM calls) require a valid GEMINI_API_KEY.
 */
class TranslatorResourceTest {

    private TranslatorResource resource;

    @BeforeEach
    void setUp() {
        resource = new TranslatorResource();
    }

    @Test
    void healthEndpointReturns200() {
        Response response = resource.health();
        assertEquals(200, response.getStatus());
        String entity = response.getEntity().toString();
        assertTrue(entity.contains("UP"));
    }

    @Test
    void translateGetReturns400WhenTextIsNull() {
        Response response = resource.translateGet(null, "English");
        assertEquals(400, response.getStatus());
        TranslationResponse body = (TranslationResponse) response.getEntity();
        assertFalse(body.isSuccess());
    }

    @Test
    void translateGetReturns400WhenTextIsBlank() {
        Response response = resource.translateGet("   ", "English");
        assertEquals(400, response.getStatus());
    }

    @Test
    void translatePostReturns400WhenRequestIsNull() {
        Response response = resource.translatePost(null);
        assertEquals(400, response.getStatus());
    }

    @Test
    void translatePostReturns400WhenTextIsEmpty() {
        TranslationRequest req = new TranslationRequest("");
        Response response = resource.translatePost(req);
        assertEquals(400, response.getStatus());
    }

    @Test
    void translationRequestModelDefaultLanguageIsEnglish() {
        TranslationRequest req = new TranslationRequest("Hello");
        assertEquals("English", req.getSourceLanguage());
    }

    @Test
    void translationResponseErrorFactory() {
        TranslationResponse err = TranslationResponse.error("something went wrong");
        assertFalse(err.isSuccess());
        assertEquals("something went wrong", err.getErrorMessage());
    }

    @Test
    void translationResponseSuccessFactory() {
        TranslationResponse ok = TranslationResponse.success("Hello", "آش حالك", "English");
        assertTrue(ok.isSuccess());
        assertEquals("Hello", ok.getOriginalText());
        assertEquals("آش حالك", ok.getTranslatedText());
        assertEquals("English", ok.getSourceLanguage());
        assertEquals("Darija (Moroccan Arabic)", ok.getTargetLanguage());
    }
}
