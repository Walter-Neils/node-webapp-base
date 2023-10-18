## Referencing a user

Referencing a user in some other collection item in another part of the database is a fairly common occurance. To do this, we use the user's MongoDB ObjectID field `_id` to reference them. This value should never change. Let it be known that any event which changes a user's `_id` field value (by recreating the record or any other mechanism) will cause undefined behaviour in other parts of the ecosystem. User IDs **MUST** be treated as immutable.
