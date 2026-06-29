/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {

    // 1. materias
    let materias = new Collection({
        name: "materias",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        schema: [
            { name: "nombre",  type: "text", required: true },
            { name: "dia",     type: "text" },
            { name: "horario", type: "text" }
        ]
    });
    app.save(materias);

    // 2. grupos
    let grupos = new Collection({
        name: "grupos",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        schema: [
            { name: "nombre",  type: "text", required: true },
            { name: "materia", type: "relation", options: { collectionId: materias.id, maxSelect: 1 } }
        ]
    });
    app.save(grupos);

    // 3. usuarios
    let usuarios = new Collection({
        name: "usuarios",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        schema: [
            { name: "cedula",      type: "text", required: true },
            { name: "pin",         type: "text", required: true },
            { name: "nombre",      type: "text", required: true },
            { name: "rol",         type: "text", required: true },
            { name: "rol_iglesia", type: "text" },
            { name: "grupo",       type: "relation", options: { collectionId: grupos.id, maxSelect: 1 } },
            { name: "activo",      type: "bool" }
        ]
    });
    app.save(usuarios);

    // 4. estudiantes
    let estudiantes = new Collection({
        name: "estudiantes",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        schema: [
            { name: "nombre",      type: "text", required: true },
            { name: "cedula",      type: "text" },
            { name: "telefono",    type: "text" },
            { name: "pin",         type: "text" },
            { name: "rol_iglesia", type: "text" },
            { name: "grupo",       type: "relation", options: { collectionId: grupos.id, maxSelect: 1 } },
            { name: "activo",      type: "bool" }
        ]
    });
    app.save(estudiantes);

    // 5. asistencia
    let asistencia = new Collection({
        name: "asistencia",
        type: "base",
        listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "",
        schema: [
            { name: "fecha",          type: "text", required: true },
            { name: "estado",         type: "text", required: true },
            { name: "estudiante",     type: "relation", options: { collectionId: estudiantes.id, maxSelect: 1 } },
            { name: "grupo",          type: "relation", options: { collectionId: grupos.id,      maxSelect: 1 } },
            { name: "registrado_por", type: "relation", options: { collectionId: usuarios.id,    maxSelect: 1 } }
        ]
    });
    app.save(asistencia);

    // 6. Admin por defecto
    let adminUser = new Record(usuarios);
    adminUser.set("cedula", "12345");
    adminUser.set("pin",    "0000");
    adminUser.set("nombre", "Administrador Web");
    adminUser.set("rol",    "admin");
    adminUser.set("activo", true);
    app.save(adminUser);

}, (app) => {
    try { let c = app.findCollectionByNameOrId("asistencia");  app.delete(c); } catch(e){}
    try { let c = app.findCollectionByNameOrId("estudiantes"); app.delete(c); } catch(e){}
    try { let c = app.findCollectionByNameOrId("usuarios");    app.delete(c); } catch(e){}
    try { let c = app.findCollectionByNameOrId("grupos");      app.delete(c); } catch(e){}
    try { let c = app.findCollectionByNameOrId("materias");    app.delete(c); } catch(e){}
});
