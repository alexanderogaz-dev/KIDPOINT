package cl.kidpoint.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import cl.kidpoint.app.ui.KidpointApp
import cl.kidpoint.app.ui.theme.KidpointTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { KidpointTheme { KidpointApp() } }
    }
}
