package cl.kidpoint.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val KidpointColors = lightColorScheme(
    primary = Color(0xFF3157D5),
    secondary = Color(0xFF00A88F),
    tertiary = Color(0xFFFFB547),
    background = Color(0xFFF7F8FC),
    surface = Color.White,
)

@Composable
fun KidpointTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = KidpointColors, content = content)
}
