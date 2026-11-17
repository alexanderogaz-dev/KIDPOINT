package cl.kidpoint.app.domain.model

import org.junit.Assert.assertEquals
import org.junit.Test

class FamilyModelsTest {
    @Test fun rolesAreNotElevatedByDefault() {
        assertEquals(FamilyRole.values().toList(), listOf(FamilyRole.PARENT, FamilyRole.CHILD))
    }

    @Test fun childProfileDefaultsToChileWithoutCollectingOptionalFields() {
        val child = ChildProfile(id = "child-1", displayName = "Alex", age = 10)
        assertEquals("CL", child.countryCode)
        assertEquals(null, child.schoolGrade)
        assertEquals(emptyList<String>(), child.subjects)
    }
}
