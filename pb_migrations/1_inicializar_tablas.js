/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const dao = app.dao();

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
    dao.saveCollection(materias);

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
    dao.saveCollection(grupos);

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
    dao.saveCollection(usuarios);

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
    dao.saveCollection(estudiantes);

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
    dao.saveCollection(asistencia);

    // 6. Admin por defecto
    let adminUser = new Record(usuarios);
    adminUser.set("cedula", "12345");
    adminUser.set("pin",    "0000");
    adminUser.set("nombre", "Administrador Web");
    adminUser.set("rol",    "admin");
    adminUser.set("activo", true);
    dao.saveRecord(adminUser);

}, (app) => {
    const dao = app.dao();
    try { dao.deleteCollection(dao.findCollectionByNameOrId("asistencia"));  } catch(e){}
    try { dao.deleteCollection(dao.findCollectionByNameOrId("estudiantes")); } catch(e){}
    try { dao.deleteCollection(dao.findCollectionByNameOrId("usuarios"));    } catch(e){}
    try { dao.deleteCollection(dao.findCollectionByNameOrId("grupos"));      } catch(e){}
    try { dao.deleteCollection(dao.findCollectionByNameOrId("materias"));    } catch(e){}
});
