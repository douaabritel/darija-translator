package ma.translator.resource;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import ma.translator.model.TranslationRequest;
import ma.translator.model.TranslationResponse;
import ma.translator.service.GeminiTranslationService;
import ma.translator.service.TranslationException;
import ma.translator.service.TranslationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * JAX-RS endpoint for translating text to Moroccan Arabic Dialect (Darija).
 *
 * <p>Base path: {@code /api/translator}</p>
 * <ul>
 *   <li>{@code GET  /health}    — public health check</li>
 *   <li>{@code GET  /translate} — translate via query parameters (requires auth)</li>
 *   <li>{@code POST /translate} — translate via JSON body (requires auth)</li>
 * </ul>
 */
@Path("/translator")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TranslatorResource {

    private static final Logger logger = LoggerFactory.getLogger(TranslatorResource.class);

    private final TranslationService translationService = new GeminiTranslationService();

    @GET
    @Path("/health")
    @PermitAll
    public Response health() {
        return Response.ok("{\"status\":\"UP\",\"service\":\"Darija Translator\"}").build();
    }

    /**
     * Translates text supplied as a query parameter.
     *
     * @param text           the text to translate (required)
     * @param sourceLanguage source language label, defaults to {@code English}
     */
    @GET
    @Path("/translate")
    @RolesAllowed({"user", "admin"})
    public Response translateGet(
            @QueryParam("text") String text,
            @QueryParam("lang") @DefaultValue("English") String sourceLanguage) {

        if (text == null || text.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(TranslationResponse.error("Query parameter 'text' is required."))
                    .build();
        }

        return performTranslation(text.trim(), sourceLanguage);
    }

    /**
     * Translates text supplied in a JSON request body.
     *
     * @param request the translation request
     */
    @POST
    @Path("/translate")
    @RolesAllowed({"user", "admin"})
    public Response translatePost(TranslationRequest request) {

        if (request == null || request.getText() == null || request.getText().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(TranslationResponse.error("Request body with non-empty 'text' field is required."))
                    .build();
        }

        String lang = (request.getSourceLanguage() != null && !request.getSourceLanguage().isBlank())
                ? request.getSourceLanguage()
                : "English";

        return performTranslation(request.getText().trim(), lang);
    }

    private Response performTranslation(String text, String sourceLanguage) {
        try {
            logger.info("Translation request | lang={} | text=[{}]",
                    sourceLanguage, text.substring(0, Math.min(60, text.length())));

            String translated = translationService.translate(text, sourceLanguage);

            TranslationResponse response = TranslationResponse.success(text, translated, sourceLanguage);
            logger.info("Translation successful");
            return Response.ok(response).build();

        } catch (TranslationException e) {
            logger.error("Translation failed: {}", e.getMessage());
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(TranslationResponse.error(e.getMessage()))
                    .build();
        } catch (Exception e) {
            logger.error("Unexpected error during translation", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(TranslationResponse.error("Internal server error."))
                    .build();
        }
    }
}
