migrate((app) => {
    // 1. Crear colección 'materias'
    const materias = new Collection({
        name: "materias",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        fields: [
            { name: "nombre", type: "text", required: true },
            { name: "dia", type: "text" },
            { name: "horario", type: "text" }
        ]
    });
    app.save(materias);

    // 2. Crear colección 'grupos' (vinculada a materia)
    const grupos = new Collection({
        name: "grupos",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        fields: [
            { name: "nombre", type: "text", required: true },
            { name: "materia", type: "relation", collectionId: materias.id, maxSelect: 1 }
        ]
    });
    app.save(grupos);

    // 3. Crear colección 'usuarios' (para el login de la web)
    const usuarios = new Collection({
        name: "usuarios",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        fields: [
            { name: "cedula", type: "text", required: true },
            { name: "pin", type: "text", required: true },
            { name: "nombre", type: "text", required: true },
            { name: "rol", type: "text", required: true },
            { name: "rol_iglesia", type: "text" },
            { name: "grupo", type: "relation", collectionId: grupos.id, maxSelect: 1 },
            { name: "activo", type: "bool" }
        ]
    });
    app.save(usuarios);

    // 4. Crear colección 'estudiantes'
    const estudiantes = new Collection({
        name: "estudiantes",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        fields: [
            { name: "nombre", type: "text", required: true },
            { name: "cedula", type: "text" },
            { name: "telefono", type: "text" },
            { name: "pin", type: "text" },
            { name: "rol_iglesia", type: "text" },
            { name: "grupo", type: "relation", collectionId: grupos.id, maxSelect: 1 },
            { name: "activo", type: "bool" }
        ]
    });
    app.save(estudiantes);

    // 5. Crear colección 'asistencia'
    const asistencia = new Collection({
        name: "asistencia",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        fields: [
            { name: "fecha", type: "text", required: true },
            { name: "estado", type: "text", required: true },
            { name: "estudiante", type: "relation", collectionId: estudiantes.id, maxSelect: 1 },
            { name: "grupo", type: "relation", collectionId: grupos.id, maxSelect: 1 },
            { name: "registrado_por", type: "relation", collectionId: usuarios.id, maxSelect: 1 }
        ]
    });
    app.save(asistencia);

    // 6. IMPORTANTE: Crear un usuario administrador por defecto para poder entrar
    const adminUser = new Record(usuarios);
    adminUser.set("cedula", "12345");
    adminUser.set("pin", "0000");
    adminUser.set("nombre", "Administrador Web");
    adminUser.set("rol", "admin");
    adminUser.set("activo", true);
    app.save(adminUser);

}, (app) => {
    // Rollback en caso de error (borra las tablas en orden inverso)
    try { app.delete(app.findCollectionByNameOrId("asistencia")); } catch(e){}
    try { app.delete(app.findCollectionByNameOrId("estudiantes")); } catch(e){}
    try { app.delete(app.findCollectionByNameOrId("usuarios")); } catch(e){}
    try { app.delete(app.findCollectionByNameOrId("grupos")); } catch(e){}
    try { app.delete(app.findCollectionByNameOrId("materias")); } catch(e){}
});