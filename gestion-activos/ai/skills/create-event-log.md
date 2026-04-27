# SKILL: CREATE EVENT LOG

## CONTEXT

The system requires that every important action on an Asset generates an EventLog.

EventLog model includes:

* tipo
* descripcion
* fecha
* assetId

---

## OBJECTIVE

Integrate EventLog creation into an existing operation.

---

## RULES

* ALWAYS create a log after the main action
* Log must reference the correct assetId
* Use descriptive "tipo" (e.g., CREACION, ACTUALIZACION, CAMBIO_ESTADO)
* Write clear "descripcion"

---

## IMPLEMENTATION

* Use Prisma to create the log
* Place log creation AFTER main DB operation
* Ensure it does not break main flow

---

## RESTRICTIONS

* DO NOT duplicate logic
* DO NOT create logs without context
* DO NOT modify unrelated code

---

## OUTPUT FORMAT

* Updated code with log integration
* Brief explanation

---

## USAGE

Use this skill when:

* Creating assets
* Updating assets
* Changing state
* Assigning users

Example request:

"Add EventLog to asset creation endpoint"
