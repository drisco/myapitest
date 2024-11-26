const express = require('express');
const firebaseAdmin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialisation de Firebase Admin SDK
const serviceAccount = require("./config/macleprive.json"); // Ton fichier de clé Firebase
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://apiproject-e35da-default-rtdb.firebaseio.com",
});

// Initialisation de Express
const app = express();
app.use(bodyParser.json()); // Middleware pour traiter les données JSON

// Référence à la base de données
const db = firebaseAdmin.database();

// API 1: Créer un objet
app.post('/create', (req, res) => {
  const { name, description } = req.body;

  // Vérification si les données sont valides
  if (!name || !description) {
    return res.status(400).send('Nom et description sont requis');
  }

  // Ajouter l'objet à Firebase
  const newObjectRef = db.ref('objects').push();  // Créer une nouvelle référence dans 'objects'
  newObjectRef.set({ name, description })
    .then(() => res.status(201).send({ id: newObjectRef.key, name, description }))
    .catch((error) => res.status(500).send(error));
});

// API 2: Afficher tous les objets
app.get('/objects', (req, res) => {
  db.ref('objects').once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        return res.status(200).send(data);
      } else {
        return res.status(404).send('Aucun objet trouvé');
      }
    })
    .catch((error) => res.status(500).send(error));
});

// API 3: Supprimer un objet
app.delete('/delete/:id', (req, res) => {
  const objectId = req.params.id;
  db.ref('objects/' + objectId).remove()
    .then(() => res.status(200).send(`Objet avec ID ${objectId} supprimé`))
    .catch((error) => res.status(500).send(error));
});

// API 4: Modifier un objet
app.put('/update/:id', (req, res) => {
  const objectId = req.params.id;
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).send('Nom et description sont requis pour la mise à jour');
  }

  db.ref('objects/' + objectId).update({ name, description })
    .then(() => res.status(200).send({ id: objectId, name, description }))
    .catch((error) => res.status(500).send(error));
});

// API 5: Recherche d'un objet par nom
app.get('/search', (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).send('Le nom est requis pour la recherche');
  }

  db.ref('objects').orderByChild('name').equalTo(name).once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        return res.status(200).send(data);
      } else {
        return res.status(404).send('Aucun objet trouvé avec ce nom');
      }
    })
    .catch((error) => res.status(500).send(error));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
