package cl.kidpoint.app.domain.model

/** Roles are assigned by the trusted backend; the client must never promote a user. */
enum class FamilyRole { PARENT, CHILD }

enum class TaskCategory { HOME, SCHOOL, PERSONAL }
enum class TaskStatus { PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED, EXPIRED }

data class ChildProfile(
    val id: String,
    val displayName: String,
    val age: Int,
    val countryCode: String = "CL",
    val schoolGrade: String? = null,
    val subjects: List<String> = emptyList(),
)

data class FamilyTask(
    val id: String,
    val childId: String,
    val title: String,
    val description: String,
    val category: TaskCategory,
    val status: TaskStatus,
    val points: Int,
    val requiresApproval: Boolean = true,
)

data class FamilyBalance(val points: Long = 0, val credits: Long = 0)
