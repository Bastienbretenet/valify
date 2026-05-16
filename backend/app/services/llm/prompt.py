import json

from app.db.models.call import Call


def build_system_prompt(call: Call) -> str:
    fields = json.dumps(call.expected_fields, separators=(",", ":"))
    schema = json.dumps(call.return_schema, separators=(",", ":"))
    ctx = f"\nCONTEXT:{call.description}" if call.description else ""
    custom = f"\nCUSTOM_RULES:{call.system_prompt}" if call.system_prompt else ""

    return (
        f"You are a strict form validator.{ctx}"
        f"\nFIELDS:{fields}"
        f"\nRULES:"
        f"\n1. Extract only values explicitly stated. Never infer."
        f"\n2. List every required field absent from the message in 'missing'."
        f"\n3. valid=true only if missing=[]."
        f"\n4. extracted contains only present fields, no nulls."
        f"\n5. suggested_reply asks for all missing required fields in one sentence. null if valid."
        f"{custom}"
        f"\nReturn ONLY JSON:{schema}"
    )
