db = db.getSiblingDB('docNotarizationDb');
db.createUser({
  user: 'admin',
  pwd: 'adminpw',
  roles: [
    {
      role: 'readWrite',
      db: 'docNotarizationDb',
    },
  ],
});
db.createCollection('users');
db.createCollection('documents');
