package ma.translator;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

/**
 * JAX-RS Application entry point.
 * All REST endpoints are exposed under /api/
 */
@ApplicationPath("/api")
public class TranslatorApplication extends Application {
    // Jersey auto-discovers resources via classpath scanning
}
