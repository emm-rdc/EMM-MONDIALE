// ============================================
// LOGIQUE PRINCIPALE — EMM MONDIAL
// ============================================

var currentUser = null;

// ========== SPLASH SCREEN ==========
function showSplash() {
  showScreen('splashScreen');
  setTimeout(function() {
    var sess = DB.get('session');
    if (sess) {
      currentUser = sess;
      appliquerSession();
      showScreen('mainScreen');
    } else {
      showScreen('loginScreen');
      var inp = document.getElementById('loginUsername');
      if (inp) inp.focus();
    }
  }, 2500);
}

// ========== NAVIGATION ==========
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  var el = document.getElementById(id);
  el.classList.add('active');
  if (id === 'splashScreen' || id === 'loginScreen') {
    el.style.display = 'flex';
  } else {
    el.style.display = 'block';
  }
  window.scrollTo(0, 0);
}

function switchMainTab(name, btn) {
  document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.main-tab-content').forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'general') afficherDashboard();
}

// ========== LOGIN / LOGOUT ==========
function login() {
  var nom = document.getElementById('loginUsername').value.trim().toLowerCase();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');

  if (!nom || !pass) {
    errBox.textContent = '❌ Entrez le nom d\'utilisateur et le mot de passe';
    return;
  }

  var users = DB.get('users', []);
  var user = users.find(function(u) {
    return u.nom.toLowerCase() === nom && u.pass === pass;
  });

  if (!user) {
    errBox.textContent = '❌ Nom d\'utilisateur ou mot de passe incorrect';
    return;
  }

  currentUser = user;
  DB.set('session', user);
  errBox.textContent = '';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';

  appliquerSession();
  showScreen('mainScreen');
}

function logout() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?\n\nVos données sont sauvegardées automatiquement.')) return;
  currentUser = null;
  DB.set('session', null);
  showScreen('loginScreen');
  setTimeout(function() {
    var inp = document.getElementById('loginUsername');
    if (inp) inp.focus();
  }, 200);
}

function appliquerSession() {
  if (!currentUser) return;
  var label = document.getElementById('userRoleLabel');
  if (label) {
    label.textContent = (currentUser.role === 'admin' ? '👑 Admin' : '👤 ' + currentUser.nom);
  }
  var wb = document.getElementById('welcomeBox');
  if (wb) {
    wb.innerHTML = '<p style="font-size:14px">Connecté en tant que : <strong>' + echapper(currentUser.nom) + '</strong></p>' +
      '<p style="font-size:12px;color:#666;margin-top:4px">Rôle : ' + (currentUser.role === 'admin' ? '👑 Administrateur Provincial' : '👤 Utilisateur') + '</p>';
  }
  refreshAll();
  afficherDashboard();
  afficherAnnonces();
}

// ========== UTILITAIRES ==========
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('fr-FR'); }
function echapper(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function isAdmin() { return currentUser && currentUser.role === 'admin'; }

// ========== ANNONCES ==========
function afficherAnnonces() {
  var list = DB.get('annonces', []);
  var box = document.getElementById('announcementsBox');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucune annonce.</p>'; return; }
  var html = '';
  list.slice().reverse().forEach(function(a) {
    html += '<div class="item-list"><strong>📢 ' + a.date + '</strong><br>' + echapper(a.texte) + '</div>';
  });
  box.innerHTML = html;
}

function publierAnnonce() {
  if (!isAdmin()) return alert('Réservé à l\'administrateur');
  var texte = document.getElementById('annonceText').value.trim();
  if (!texte) return alert('Écrivez une annonce');
  var list = DB.get('annonces', []);
  list.push({ id: uid(), texte: texte, date: new Date().toLocaleDateString('fr-FR'), auteur: currentUser.nom });
  DB.set('annonces', list);
  document.getElementById('annonceText').value = '';
  afficherAnnonces();
  alert('✅ Annonce publiée');
}

// ========== MODULE I — ENTITÉS ==========
function ajouterEntite() {
  var type = document.getElementById('jTypeEntite').value;
  var nom = document.getElementById('jNomEntite').value.trim().toUpperCase();
  var resp = document.getElementById('jResponsable').value.trim();
  if (!nom || !resp) return alert('Remplissez tous les champs');
  var entites = DB.get('entites', []);
  if (entites.find(function(e) { return e.nom === nom; })) return alert('Cette entité existe déjà');
  entites.push({ id: uid(), type: type, nom: nom, responsable: resp });
  DB.set('entites', entites);
  document.getElementById('jNomEntite').value = '';
  document.getElementById('jResponsable').value = '';
  refreshAll();
  alert('✅ Entité ajoutée : ' + nom);
}

function rafraichirEntites() {
  var entites = DB.get('entites', []);
  ['jEntiteSelect', 'mEntite'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var val = sel.value;
    var opts = '';
    entites.forEach(function(e) {
      opts += '<option value="' + e.id + '">' + e.type + ' - ' + e.nom + '</option>';
    });
    sel.innerHTML = opts;
    if (val) sel.value = val;
  });
}

function getEntiteNom(id) {
  var e = DB.get('entites', []).find(function(x) { return x.id === id; });
  return e ? e.type + ' - ' + e.nom : 'Inconnu';
}

function afficherListeEntites() {
  var entites = DB.get('entites', []);
  var box = document.getElementById('listeEntites');
  if (!box) return;
  if (!entites.length) { box.innerHTML = '<p>Aucune entité enregistrée.</p>'; return; }
  var html = '';
  entites.forEach(function(e) {
    html += '<div class="item-list" style="padding:12px">';
    html += '<div style="font-size:14px;color:#0a6e2c;font-weight:600;margin-bottom:4px">🏛️ ' + echapper(e.type) + ' - ' + echapper(e.nom) + '</div>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">👤 Responsable : ' + echapper(e.responsable) + '</div>';
    html += '<button class="btn-mini orange" onclick="modifierEntite(\'' + e.id + '\')">✏️ Modifier</button> ';
    html += '<button class="btn-mini danger" onclick="supprimerEntite(\'' + e.id + '\')">🗑️ Supprimer</button>';
    html += '</div>';
  });
  box.innerHTML = html;
}

function modifierEntite(id) {
  var list = DB.get('entites', []);
  var e = list.find(function(x) { return x.id === id; });
  if (!e) return;
  var type = prompt('Type d\'entité :', e.type);
  if (type === null) return;
  var nom = prompt('Nom de l\'entité :', e.nom);
  if (nom === null) return;
  var resp = prompt('Nom du responsable :', e.responsable);
  if (resp === null) return;
  var nouveauNom = nom.trim().toUpperCase();
  if (!nouveauNom) return alert('Nom vide');
  var doublon = list.find(function(x) { return x.id !== id && x.nom === nouveauNom; });
  if (doublon) return alert('⚠️ Une autre entité porte déjà ce nom');
  e.type = type.trim() || e.type;
  e.nom = nouveauNom;
  e.responsable = resp.trim();
  DB.set('entites', list);
  refreshAll();
  alert('✅ Entité modifiée');
}

function supprimerEntite(id) {
  var e = DB.get('entites', []).find(function(x) { return x.id === id; });
  if (!e) return;
  var parts = DB.get('participations', []).filter(function(p) { return p.entiteId === id; });
  var msg = '⚠️ Supprimer l\'entité "' + e.nom + '" ?';
  if (parts.length) msg += '\n\n' + parts.length + ' participation(s) liée(s) seront AUSSI supprimées.';
  if (!confirm(msg)) return;
  DB.set('entites', DB.get('entites', []).filter(function(x) { return x.id !== id; }));
  DB.set('participations', DB.get('participations', []).filter(function(p) { return p.entiteId !== id; }));
  refreshAll();
  alert('✅ Entité supprimée');
}

// ========== MODULE I — JOURNALIÈRE ==========
function enregistrerParticipation() {
  var entiteId = document.getElementById('jEntiteSelect').value;
  var date = document.getElementById('jDate').value;
  var m = parseInt(document.getElementById('jMembres').value) || 0;
  var s = parseInt(document.getElementById('jSympathisants').value) || 0;
  var n = parseInt(document.getElementById('jNouveaux').value) || 0;
  if (!entiteId) return alert('⚠️ Enregistrez d\'abord une entité');
  if (!date) return alert('Choisissez une date');
  var list = DB.get('participations', []);
  list.push({ id: uid(), entiteId: entiteId, date: date, m: m, s: s, n: n, createdAt: new Date().toISOString(), auteur: currentUser ? currentUser.nom : '' });
  DB.set('participations', list);
  afficherJournaliere();
  alert('✅ Participation enregistrée');
}

function afficherJournaliere() {
  var parts = DB.get('participations', []);
  var box = document.getElementById('listeJournaliere');
  if (!box) return;
  if (!parts.length) { box.innerHTML = '<p>Aucune donnée.</p>'; return; }
  var parEntite = {};
  parts.forEach(function(p) {
    if (!parEntite[p.entiteId]) parEntite[p.entiteId] = [];
    parEntite[p.entiteId].push(p);
  });
  var html = '';
  Object.keys(parEntite).forEach(function(eid) {
    var lignes = parEntite[eid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var tm = 0, ts = 0, tn = 0;
    lignes.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
    html += '<div class="entity-block">';
    html += '<h4>📍 ' + echapper(getEntiteNom(eid)) + '</h4>';
    html += '<div class="table-wrapper"><table class="data-table">';
    html += '<thead><tr><th>Date</th><th>M</th><th>S</th><th>NV</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(p) {
      html += '<tr>';
      html += '<td>' + fmtDate(p.date) + '</td>';
      html += '<td class="num">' + p.m + '</td>';
      html += '<td class="num">' + p.s + '</td>';
      html += '<td class="num">' + p.n + '</td>';
      html += '<td>';
      html += '<button class="btn-mini orange" onclick="modifierParticipation(\'' + p.id + '\')">✏️</button>';
      html += '<button class="btn-mini danger" onclick="supprimerParticipation(\'' + p.id + '\')">🗑️</button>';
      html += '</td></tr>';
    });
    html += '</tbody>';
    html += '<tfoot><tr><td>TOTAL</td><td class="num">' + tm + '</td><td class="num">' + ts + '</td><td class="num">' + tn + '</td><td></td></tr></tfoot>';
    html += '</table></div></div>';
  });
  box.innerHTML = html;
}

function modifierParticipation(id) {
  var list = DB.get('participations', []);
  var p = list.find(function(x) { return x.id === id; });
  if (!p) return;
  var date = prompt('Date (AAAA-MM-JJ) :', p.date);
  if (date === null) return;
  var m = prompt('Membres :', p.m);
  if (m === null) return;
  var s = prompt('Sympathisants :', p.s);
  if (s === null) return;
  var n = prompt('Nouveaux venus :', p.n);
  if (n === null) return;
  p.date = date.trim();
  p.m = parseInt(m) || 0;
  p.s = parseInt(s) || 0;
  p.n = parseInt(n) || 0;
  DB.set('participations', list);
  afficherJournaliere();
  alert('✅ Modifiée');
}

function supprimerParticipation(id) {
  if (!confirm('⚠️ Supprimer cette participation ?')) return;
  DB.set('participations', DB.get('participations', []).filter(function(x) { return x.id !== id; }));
  afficherJournaliere();
}

// ========== MODULE I — FICHE MENSUELLE ==========
function enregistrerFicheMensuelle() {
  var numericIds = [
    'mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux',
    'mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers',
    'mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit',
    'mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions',
    'mTerrains','mCampagnes','mCoursEns','mCoursFleurs'
  ];
  var f = {
    id: uid(),
    entiteId: document.getElementById('mEntite').value,
    mois: document.getElementById('mMois').value,
    annee: document.getElementById('mAnnee').value,
    responsable: document.getElementById('mResponsable').value,
    jourReunion: document.getElementById('mJourReunion').value,
    themes: document.getElementById('mThemes').value,
    graces: document.getElementById('mGraces').value,
    points: document.getElementById('mPoints').value,
    solutions: document.getElementById('mSolutions').value,
    objectifs: document.getElementById('mObjectifs').value,
    actions: document.getElementById('mActions').value,
    dateCreation: new Date().toISOString()
  };
  numericIds.forEach(function(id) {
    var el = document.getElementById(id);
    f[id] = el ? (parseInt(el.value) || 0) : 0;
  });
  if (!f.entiteId) return alert('⚠️ Enregistrez d\'abord une entité');
  var list = DB.get('fichesMensuelles', []);
  list.push(f);
  DB.set('fichesMensuelles', list);
  alert('✅ Fiche mensuelle enregistrée');
}

function tableFicheMensuelle(f) {
  var h = '<div class="entity-block">';
  h += '<h4>📍 ' + echapper(getEntiteNom(f.entiteId)) + ' — ' + echapper(f.mois) + ' ' + echapper(f.annee) + '</h4>';
  h += '<div style="margin-bottom:8px">';
  h += '<button class="btn-mini danger" onclick="supprimerFiche(\'' + f.id + '\')">🗑️ Supprimer</button>';
  h += '</div>';
  h += '<div class="table-wrapper"><table class="data-table"><tbody>';
  h += '<tr><td>Responsable</td><td>' + echapper(f.responsable) + '</td></tr>';
  h += '<tr><td>Encadreurs</td><td class="num">' + (f.mEncadreurs || 0) + '</td></tr>';
  h += '<tr><td>Membres actifs</td><td class="num">' + (f.mMembresActifs || 0) + '</td></tr>';
  h += '<tr><td>Sympathisants</td><td class="num">' + (f.mSympathisants || 0) + '</td></tr>';
  h += '<tr><td>Membres (culte)</td><td class="num">' + (f.mFMembres || 0) + '</td></tr>';
  h += '<tr><td>Symp. (culte)</td><td class="num">' + (f.mFSympathisants || 0) + '</td></tr>';
  h += '<tr><td>Nouv. venus</td><td class="num">' + (f.mFNouveaux || 0) + '</td></tr>';
  h += '<tr><td>Thèmes</td><td>' + echapper(f.themes) + '</td></tr>';
  h += '<tr><td>Grâces</td><td>' + echapper(f.graces) + '</td></tr>';
  h += '<tr><td>Points à améliorer</td><td>' + echapper(f.points) + '</td></tr>';
  h += '<tr><td>Solutions</td><td>' + echapper(f.solutions) + '</td></tr>';
  h += '<tr><td>Objectifs</td><td>' + echapper(f.objectifs) + '</td></tr>';
  h += '<tr><td>Actions</td><td>' + echapper(f.actions) + '</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function supprimerFiche(id) {
  if (!confirm('⚠️ Supprimer cette fiche ?')) return;
  DB.set('fichesMensuelles', DB.get('fichesMensuelles', []).filter(function(x) { return x.id !== id; }));
  alert('✅ Supprimée');
  rapportFreqDetaille();
}

function rechercherFreq() {
  var q = document.getElementById('searchFreq').value.toLowerCase().trim();
  if (!q) { document.getElementById('rapportFreqBox').innerHTML = ''; return; }
  var fiches = DB.get('fichesMensuelles', []).filter(function(f) {
    return getEntiteNom(f.entiteId).toLowerCase().indexOf(q) !== -1;
  });
  var html = '<h3>Résultats (' + fiches.length + ')</h3>';
  if (!fiches.length) html += '<p>Aucun résultat.</p>';
  else fiches.forEach(function(f) { html += tableFicheMensuelle(f); });
  document.getElementById('rapportFreqBox').innerHTML = html;
}

// ========== RAPPORTS MODULE I ==========
function rapportFreqGlobal() {
  var fiches = DB.get('fichesMensuelles', []);
  var parts = DB.get('participations', []);
  var tm = 0, ts = 0, tn = 0;
  parts.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });

  var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FRÉQUENCES</h3></div>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches.length + '</td></tr>';
  html += '<tr><td>Participations journalières</td><td class="num">' + parts.length + '</td></tr>';
  html += '<tr><td>Total Membres</td><td class="num">' + tm + '</td></tr>';
  html += '<tr><td>Total Sympathisants</td><td class="num">' + ts + '</td></tr>';
  html += '<tr><td>Total Nouveaux venus</td><td class="num">' + tn + '</td></tr>';
  html += '</tbody></table></div>';

  if (fiches.length) {
    html += '<h4 style="color:#0a6e2c;margin:16px 0 8px">📌 Détails par entité</h4>';
    var parEntite = {};
    fiches.forEach(function(f) {
      if (!parEntite[f.entiteId]) parEntite[f.entiteId] = [];
      parEntite[f.entiteId].push(f);
    });
    Object.keys(parEntite).forEach(function(eid) {
      var liste = parEntite[eid];
      var sm = 0, ss = 0, sn = 0;
      liste.forEach(function(f) { sm += (f.mFMembres || 0); ss += (f.mFSympathisants || 0); sn += (f.mFNouveaux || 0); });
      html += '<div class="entity-block">';
      html += '<h4>📍 ' + echapper(getEntiteNom(eid)) + '</h4>';
      html += '<div class="table-wrapper"><table class="data-table">';
      html += '<thead><tr><th>Mois</th><th>M</th><th>S</th><th>NV</th></tr></thead><tbody>';
      liste.forEach(function(f) {
        html += '<tr><td>' + echapper(f.mois) + ' ' + f.annee + '</td><td class="num">' + (f.mFMembres || 0) + '</td><td class="num">' + (f.mFSympathisants || 0) + '</td><td class="num">' + (f.mFNouveaux || 0) + '</td></tr>';
      });
      html += '</tbody>';
      html += '<tfoot><tr><td>TOTAL</td><td class="num">' + sm + '</td><td class="num">' + ss + '</td><td class="num">' + sn + '</td></tr></tfoot>';
      html += '</table></div></div>';
    });
  }
  document.getElementById('rapportFreqBox').innerHTML = html;
}

function rapportFreqDetaille() {
  var fiches = DB.get('fichesMensuelles', []);
  if (!fiches.length) { document.getElementById('rapportFreqBox').innerHTML = '<p>Aucune fiche enregistrée.</p>'; return; }
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FRÉQUENCES</h3></div>';
  fiches.forEach(function(f) { html += tableFicheMensuelle(f); });
  document.getElementById('rapportFreqBox').innerHTML = html;
}

// ========== MODULE II — CANDIDATS ==========
function ajouterCandidat() {
  var nom = document.getElementById('cNom').value.trim();
  var typeEntite = document.getElementById('cTypeEntite').value;
  var nomEntite = document.getElementById('cNomEntite').value.trim().toUpperCase();
  var responsable = document.getElementById('cResponsable').value.trim();
  var motif = document.getElementById('cMotif').value;
  var montant = parseFloat(document.getElementById('cMontant').value) || 0;
  var taux = parseFloat(document.getElementById('cTaux').value) || 2300;

  if (!nom) return alert('Entrez le nom du candidat');
  if (!nomEntite) return alert('Entrez le nom de l\'entité');

  var list = DB.get('candidats', []);
  var existe = list.find(function(c) {
    return c.nom.toLowerCase() === nom.toLowerCase() && c.motif === motif && c.statut !== 'archive';
  });
  if (existe) return alert('⚠️ Ce candidat a déjà un versement en cours pour ce motif');

  list.push({
    id: uid(), nom: nom, typeEntite: typeEntite, nomEntite: nomEntite,
    responsable: responsable, motif: motif, montantPrevu: montant, taux: taux,
    totalVerse: 0, statut: 'en_cours', dateInscription: new Date().toISOString()
  });
  DB.set('candidats', list);
  document.getElementById('cNom').value = '';
  document.getElementById('cNomEntite').value = '';
  document.getElementById('cResponsable').value = '';
  document.getElementById('cMontant').value = '200';
  refreshAll();
  alert('✅ Candidat ajouté : ' + nom);
}

function afficherCandidats() {
  var search = (document.getElementById('searchCand') ? document.getElementById('searchCand').value : '').toLowerCase();
  var list = DB.get('candidats', []).filter(function(c) { return c.statut === 'en_cours'; });
  if (search) list = list.filter(function(c) { return c.nom.toLowerCase().indexOf(search) !== -1; });
  list.sort(function(a, b) { return a.nom.localeCompare(b.nom); });

  var box = document.getElementById('listeCandidats');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucun candidat en cours.</p>'; }
  else {
    var html = '<div class="table-wrapper"><table class="data-table">';
    html += '<thead><tr><th>Nom</th><th>Entité</th><th>Motif</th><th>Versé</th><th>Actions</th></tr></thead><tbody>';
    list.forEach(function(c) {
      html += '<tr>';
      html += '<td>' + echapper(c.nom) + '</td>';
      html += '<td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td>';
      html += '<td>' + echapper(c.motif) + '</td>';
      html += '<td class="num">' + c.totalVerse.toFixed(2) + '$</td>';
      html += '<td>';
      html += '<button class="btn-mini" onclick="verserRapide(\'' + c.id + '\')">💵</button>';
      html += '<button class="btn-mini danger" onclick="supprimerCandidat(\'' + c.id + '\')">🗑️</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';
    box.innerHTML = html;
  }
  afficherTermines();
}

function afficherTermines() {
  var list = DB.get('candidats', []).filter(function(c) { return c.statut === 'termine'; });
  list.sort(function(a, b) { return a.nom.localeCompare(b.nom); });
  var box = document.getElementById('listeTermines');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucun candidat terminé.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table">';
  html += '<thead><tr><th>Nom</th><th>Entité</th><th>Motif</th><th>Versé</th></tr></thead><tbody>';
  list.forEach(function(c) {
    html += '<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td><td>' + echapper(c.motif) + '</td><td class="num">' + c.totalVerse.toFixed(2) + '$</td></tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

function rafraichirCandidatsSelect() {
  var sel = document.getElementById('vCandidat');
  if (!sel) return;
  var list = DB.get('candidats', []).filter(function(c) { return c.statut === 'en_cours'; });
  list.sort(function(a, b) { return a.nom.localeCompare(b.nom); });
  var val = sel.value;
  var opts = '';
  list.forEach(function(c) {
    opts += '<option value="' + c.id + '">' + c.nom + ' - ' + c.motif + ' (' + c.nomEntite + ')</option>';
  });
  if (!opts) opts = '<option value="">-- Aucun candidat en cours --</option>';
  sel.innerHTML = opts;
  if (val) sel.value = val;
}

function verserRapide(cid) {
  rafraichirCandidatsSelect();
  document.getElementById('vCandidat').value = cid;
  document.getElementById('vDate').value = new Date().toISOString().slice(0, 10);
  switchMainTab('finance', document.querySelectorAll('.main-tab')[2]);
  setTimeout(function() {
    var v = document.getElementById('vMontant');
    if (v) v.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

function enregistrerVersement() {
  var candId = document.getElementById('vCandidat').value;
  var monnaie = document.getElementById('vMonnaie').value;
  var montant = parseFloat(document.getElementById('vMontant').value) || 0;
  var taux = parseFloat(document.getElementById('vTaux').value) || 2300;
  var date = document.getElementById('vDate').value || new Date().toISOString().slice(0, 10);

  if (!candId) return alert('⚠️ Choisissez un candidat');
  if (montant <= 0) return alert('Entrez un montant valide');

  var montantUSD = monnaie === 'FC' ? (montant / taux) : montant;

  var vers = DB.get('versements', []);
  vers.push({ id: uid(), candId: candId, monnaie: monnaie, montantOrigine: montant, montantUSD: montantUSD, taux: taux, date: date, dateCreation: new Date().toISOString() });
  DB.set('versements', vers);

  var cands = DB.get('candidats', []);
  var c = cands.find(function(x) { return x.id === candId; });
  if (c) {
    c.totalVerse = (c.totalVerse || 0) + montantUSD;
    if (c.totalVerse >= c.montantPrevu - 0.01) c.statut = 'termine';
  }
  DB.set('candidats', cands);

  document.getElementById('vMontant').value = 0;
  refreshAll();
  alert('✅ Versement enregistré : ' + montantUSD.toFixed(2) + '$');
}

function afficherVersements() {
  var vers = DB.get('versements', []);
  var box = document.getElementById('historiqueVersements');
  if (!box) return;
  if (!vers.length) { box.innerHTML = '<p>Aucun versement.</p>'; return; }

  var parCandidat = {};
  vers.forEach(function(v) {
    if (!parCandidat[v.candId]) parCandidat[v.candId] = [];
    parCandidat[v.candId].push(v);
  });

  var html = '';
  var ids = Object.keys(parCandidat).sort(function(a, b) {
    var ca = DB.get('candidats', []).find(function(x) { return x.id === a; });
    var cb = DB.get('candidats', []).find(function(x) { return x.id === b; });
    return (ca ? ca.nom : '').localeCompare(cb ? cb.nom : '');
  });

  ids.forEach(function(cid) {
    var c = DB.get('candidats', []).find(function(x) { return x.id === cid; });
    if (!c) return;
    var lignes = parCandidat[cid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var totalFC = 0, totalUSD = 0;
    lignes.forEach(function(v) {
      totalUSD += v.montantUSD;
      if (v.monnaie === 'FC') totalFC += v.montantOrigine;
    });
    html += '<div class="entity-block">';
    html += '<h4>👤 ' + echapper(c.nom) + '</h4>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">' + echapper(c.typeEntite) + ' - <strong>' + echapper(c.nomEntite) + '</strong> | ' + echapper(c.motif) + '</div>';
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>FC</th><th>USD</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(v) {
      html += '<tr>';
      html += '<td>' + fmtDate(v.date) + '</td>';
      html += '<td class="num">' + (v.monnaie === 'FC' ? v.montantOrigine.toLocaleString() : '-') + '</td>';
      html += '<td class="num">' + v.montantUSD.toFixed(2) + '$</td>';
      html += '<td>';
      html += '<button class="btn-mini orange" onclick="modifierVersement(\'' + v.id + '\')">✏️</button>';
      html += '<button class="btn-mini danger" onclick="supprimerVersement(\'' + v.id + '\')">🗑️</button>';
      html += '<button class="btn-mini blue" onclick="imprimerRecu(\'' + v.id + '\')">🖨️</button>';
      html += '</td></tr>';
    });
    html += '</tbody><tfoot>';
    html += '<tr><td>TOTAL</td><td class="num">' + totalFC.toLocaleString() + ' FC</td><td class="num">' + totalUSD.toFixed(2) + '$</td><td></td></tr>';
    html += '</tbody></tfoot></table></div></div>';
  });
  box.innerHTML = html;
}

function modifierVersement(vid) {
  var list = DB.get('versements', []);
  var v = list.find(function(x) { return x.id === vid; });
  if (!v) return;
  var montant = prompt('Montant :', v.montantOrigine);
  if (montant === null) return;
  var ancienUSD = v.montantUSD;
  v.montantOrigine = parseFloat(montant) || 0;
  v.montantUSD = v.monnaie === 'FC' ? (v.montantOrigine / v.taux) : v.montantOrigine;
  var cands = DB.get('candidats', []);
  var c = cands.find(function(x) { return x.id === v.candId; });
  if (c) {
    c.totalVerse = c.totalVerse - ancienUSD + v.montantUSD;
    if (c.totalVerse >= c.montantPrevu - 0.01 && c.statut === 'en_cours') c.statut = 'termine';
    if (c.totalVerse < c.montantPrevu - 0.01 && c.statut === 'termine') c.statut = 'en_cours';
  }
  DB.set('candidats', cands);
  DB.set('versements', list);
  refreshAll();
  alert('✅ Modifié');
}

function supprimerVersement(vid) {
  if (!confirm('⚠️ Supprimer ce versement ?')) return;
  var list = DB.get('versements', []);
  var v = list.find(function(x) { return x.id === vid; });
  if (!v) return;
  var cands = DB.get('candidats', []);
  var c = cands.find(function(x) { return x.id === v.candId; });
  if (c) c.totalVerse = c.totalVerse - v.montantUSD;
  DB.set('candidats', cands);
  DB.set('versements', list.filter(function(x) { return x.id !== vid; }));
  refreshAll();
  alert('✅ Supprimé');
}

function supprimerCandidat(cid) {
  if (!confirm('⚠️ Supprimer ce candidat et tous ses versements ?')) return;
  DB.set('candidats', DB.get('candidats', []).filter(function(c) { return c.id !== cid; }));
  DB.set('versements', DB.get('versements', []).filter(function(v) { return v.candId !== cid; }));
  refreshAll();
  alert('✅ Supprimé');
}

function imprimerRecu(vid) {
  var v = DB.get('versements', []).find(function(x) { return x.id === vid; });
  if (!v) return;
  var c = DB.get('candidats', []).find(function(x) { return x.id === v.candId; });
  if (!c) return;
  var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Reçu</title><style>body{font-family:Arial;padding:30px;max-width:600px;margin:auto}.header{text-align:center;border-bottom:3px double #0a6e2c;padding-bottom:15px;margin-bottom:20px}h1{color:#0a6e2c}.logo{width:80px;height:80px;background:#0a6e2c;color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;margin-bottom:10px}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px;border-bottom:1px solid #ddd}td.label{font-weight:bold;color:#0a6e2c}.montant{font-size:22px;color:#0a6e2c;font-weight:bold;text-align:center;padding:20px;background:#e8f5e9;border-radius:8px}.signature{margin-top:60px;display:flex;justify-content:space-between}.sig-line{border-top:1px solid #333;width:45%;padding-top:5px;font-size:12px;text-align:center}</style></head><body>');
  w.document.write('<div class="header"><div class="logo">EMM</div><h1>ÉGLISE MESSIANIQUE MONDIALE</h1><p style="color:#666">EMM MONDIAL - Finance</p><h2 style="color:#0a6e2c">REÇU DE VERSEMENT</h2></div>');
  w.document.write('<table><tr><td class="label">Nom</td><td>' + echapper(c.nom) + '</td></tr>');
  w.document.write('<tr><td class="label">Entité</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td></tr>');
  w.document.write('<tr><td class="label">Motif</td><td>' + echapper(c.motif) + '</td></tr>');
  w.document.write('<tr><td class="label">Date</td><td>' + fmtDate(v.date) + '</td></tr>');
  w.document.write('<tr><td class="label">Taux</td><td>1$ = ' + v.taux + ' FC</td></tr></table>');
  w.document.write('<div class="montant">' + v.montantOrigine + ' ' + v.monnaie + '<br><small>= ' + v.montantUSD.toFixed(2) + ' USD</small></div>');
  w.document.write('<div class="signature"><div class="sig-line">Le versant</div><div class="sig-line">Le responsable</div></div>');
  w.document.write('</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}

function refreshAll() {
  rafraichirEntites();
  afficherListeEntites();
  afficherJournaliere();
  rafraichirCandidatsSelect();
  afficherCandidats();
  afficherVersements();
  afficherDepensesGen();
  afficherUtilisateurs();
}
// ========== MODULE II — RAPPORTS ==========
function rapportFinGlobal() {
  var cands = DB.get('candidats', []).filter(function(c) { return c.statut !== 'archive'; });
  var vers = DB.get('versements', []);
  var totalVerse = 0, totalPrevu = 0;
  cands.forEach(function(c) { totalVerse += (c.totalVerse || 0); totalPrevu += c.montantPrevu; });

  var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — FINANCE</h3></div>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr>';
  html += '<tr><td>Terminés</td><td class="num">' + cands.filter(function(c) { return c.statut === 'termine'; }).length + '</td></tr>';
  html += '<tr><td>Total prévu</td><td class="num">' + totalPrevu.toFixed(2) + '$</td></tr>';
  html += '<tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + '$</td></tr>';
  html += '<tr><td>Solde</td><td class="num">' + (totalPrevu - totalVerse).toFixed(2) + '$</td></tr>';
  html += '<tr><td>Versements</td><td class="num">' + vers.length + '</td></tr>';
  html += '</tbody></table></div>';
  document.getElementById('rapportFinBox').innerHTML = html;
}

function rapportFinDetaille() {
  var cands = DB.get('candidats', []).slice().sort(function(a, b) { return a.nom.localeCompare(b.nom); });
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FINANCE</h3></div>';
  if (!cands.length) html += '<p>Aucun candidat.</p>';
  else {
    html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>Entité</th><th>Motif</th><th>Prévu</th><th>Versé</th><th>Solde</th></tr></thead><tbody>';
    cands.forEach(function(c) {
      html += '<tr><td>' + echapper(c.nom) + '</td><td>' + echapper(c.typeEntite) + ' - ' + echapper(c.nomEntite) + '</td><td>' + echapper(c.motif) + '</td><td class="num">' + c.montantPrevu + '$</td><td class="num">' + c.totalVerse.toFixed(2) + '$</td><td class="num">' + (c.montantPrevu - c.totalVerse).toFixed(2) + '$</td></tr>';
    });
    html += '</tbody></table></div>';
  }
  document.getElementById('rapportFinBox').innerHTML = html;
}

// ========== MODULE III — DÉPOUILLEMENT ==========
var tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], gosh: [], mita: [] };

function ajouterOffrande(type) {
  var map = {
    init:   { nom: 'dInitNom',   fc: 'dInitFC',   usd: 'dInitUSD',   list: 'listInit',   tot: 'totInit' },
    sorei:  { nom: 'dSoreiNom',  fc: 'dSoreiFC',  usd: 'dSoreiUSD',  list: 'listSorei',  tot: 'totSorei' },
    kannon: { nom: 'dKannonNom', fc: 'dKannonFC', usd: 'dKannonUSD', list: 'listKannon', tot: 'totKannon' },
    photo:  { nom: 'dPhotoNom',  fc: 'dPhotoFC',  usd: 'dPhotoUSD',  list: 'listPhoto',  tot: 'totPhoto' },
    gosh:   { nom: 'dGoshNom',   fc: 'dGoshFC',   usd: 'dGoshUSD',   list: 'listGosh',   tot: 'totGosh' },
    mita:   { nom: 'dMitaNom',   fc: 'dMitaFC',   usd: 'dMitaUSD',   list: 'listMita',   tot: 'totMita' }
  };
  var c = map[type];
  var nom = document.getElementById(c.nom).value.trim();
  var fc = parseFloat(document.getElementById(c.fc).value) || 0;
  var usd = parseFloat(document.getElementById(c.usd).value) || 0;
  if (!nom && fc === 0 && usd === 0) return alert('Remplissez au moins le nom ou un montant');
  tempOffrandes[type].push({ nom: nom || '(sans nom)', fc: fc, usd: usd });
  document.getElementById(c.nom).value = '';
  document.getElementById(c.fc).value = 0;
  document.getElementById(c.usd).value = 0;
  afficherOffrandes(type);
}

function afficherOffrandes(type) {
  var map = {
    init:   { list: 'listInit',   tot: 'totInit' },
    sorei:  { list: 'listSorei',  tot: 'totSorei' },
    kannon: { list: 'listKannon', tot: 'totKannon' },
    photo:  { list: 'listPhoto',  tot: 'totPhoto' },
    gosh:   { list: 'listGosh',   tot: 'totGosh' },
    mita:   { list: 'listMita',   tot: 'totMita' }
  };
  var c = map[type];
  var arr = tempOffrandes[type];
  var box = document.getElementById(c.list);
  if (!box) return;
  if (!arr.length) box.innerHTML = '';
  else {
    var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>FC</th><th>USD</th><th></th></tr></thead><tbody>';
    arr.forEach(function(o, i) {
      html += '<tr><td>' + echapper(o.nom) + '</td><td class="num">' + o.fc.toLocaleString() + '</td><td class="num">' + o.usd.toLocaleString() + '</td><td><button class="btn-mini danger" onclick="retirerOffrande(\'' + type + '\',' + i + ')">✖</button></td></tr>';
    });
    html += '</tbody></table></div>';
    box.innerHTML = html;
  }
  var totFC = arr.reduce(function(a, o) { return a + o.fc; }, 0);
  var totUSD = arr.reduce(function(a, o) { return a + o.usd; }, 0);
  var totEl = document.getElementById(c.tot);
  if (totEl) totEl.textContent = totFC.toLocaleString() + ' FC / ' + totUSD.toLocaleString() + ' $';
}

function retirerOffrande(type, idx) {
  tempOffrandes[type].splice(idx, 1);
  afficherOffrandes(type);
}

function calculerDepouillement() {
  var f = function(id) {
    var el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
  };
  var sumArr = function(arr) { return arr.reduce(function(a, o) { return { fc: a.fc + o.fc, usd: a.usd + o.usd }; }, { fc: 0, usd: 0 }); };
  var i = sumArr(tempOffrandes.init), s = sumArr(tempOffrandes.sorei), k = sumArr(tempOffrandes.kannon);
  var p = sumArr(tempOffrandes.photo), g = sumArr(tempOffrandes.gosh), m = sumArr(tempOffrandes.mita);
  var totalFC = f('dConstrFC') + f('dNormFC') + i.fc + s.fc + k.fc + p.fc + g.fc + m.fc;
  var totalUSD = f('dConstrUSD') + f('dNormUSD') + i.usd + s.usd + k.usd + p.usd + g.usd + m.usd;
  var soldeFC = totalFC - f('dTransFC');
  var soldeUSD = totalUSD - f('dTransUSD');
  document.getElementById('depResultat').innerHTML = '<div class="table-wrapper"><table class="data-table"><tbody>' +
    '<tr><td>Total FC</td><td class="num">' + totalFC.toLocaleString() + ' FC</td></tr>' +
    '<tr><td>Total USD</td><td class="num">' + totalUSD.toLocaleString() + ' $</td></tr>' +
    '<tr><td>Transport FC</td><td class="num">- ' + f('dTransFC').toLocaleString() + ' FC</td></tr>' +
    '<tr><td>Transport USD</td><td class="num">- ' + f('dTransUSD').toLocaleString() + ' $</td></tr>' +
    '</tbody><tfoot>' +
    '<tr><td>SOLDE FC</td><td class="num">' + soldeFC.toLocaleString() + ' FC</td></tr>' +
    '<tr><td>SOLDE USD</td><td class="num">' + soldeUSD.toLocaleString() + ' $</td></tr>' +
    '</tfoot></table></div>';
}

function enregistrerDepouillement() {
  var typeEntite = document.getElementById('dTypeEntite').value;
  var nomEntite = document.getElementById('dNomEntite').value.trim().toUpperCase();
  var responsable = document.getElementById('dResponsable').value.trim();
  var mois = document.getElementById('dMois').value;
  var annee = document.getElementById('dAnnee').value;
  var date = document.getElementById('dDate').value;
  var enveloppes = parseInt(document.getElementById('dEnveloppes').value) || 0;
  if (!nomEntite) return alert('⚠️ Entrez le nom de l\'entité');

  var d = {
    id: uid(), typeEntite: typeEntite, nomEntite: nomEntite, responsable: responsable,
    mois: mois, annee: annee, date: date, enveloppes: enveloppes,
    constrFC: parseFloat(document.getElementById('dConstrFC').value) || 0,
    constrUSD: parseFloat(document.getElementById('dConstrUSD').value) || 0,
    normFC: parseFloat(document.getElementById('dNormFC').value) || 0,
    normUSD: parseFloat(document.getElementById('dNormUSD').value) || 0,
    init: JSON.parse(JSON.stringify(tempOffrandes.init)),
    sorei: JSON.parse(JSON.stringify(tempOffrandes.sorei)),
    kannon: JSON.parse(JSON.stringify(tempOffrandes.kannon)),
    photo: JSON.parse(JSON.stringify(tempOffrandes.photo)),
    gosh: JSON.parse(JSON.stringify(tempOffrandes.gosh)),
    mita: JSON.parse(JSON.stringify(tempOffrandes.mita)),
    transFC: parseFloat(document.getElementById('dTransFC').value) || 0,
    transUSD: parseFloat(document.getElementById('dTransUSD').value) || 0,
    createdAt: new Date().toISOString()
  };
  var list = DB.get('depouillements', []);
  list.push(d);
  DB.set('depouillements', list);

  tempOffrandes = { init: [], sorei: [], kannon: [], photo: [], gosh: [], mita: [] };
  ['init','sorei','kannon','photo','gosh','mita'].forEach(function(t) { afficherOffrandes(t); });
  document.getElementById('dNomEntite').value = '';
  document.getElementById('dResponsable').value = '';
  document.getElementById('dConstrFC').value = 0;
  document.getElementById('dConstrUSD').value = 0;
  document.getElementById('dNormFC').value = 0;
  document.getElementById('dNormUSD').value = 0;
  document.getElementById('dTransFC').value = 0;
  document.getElementById('dTransUSD').value = 0;
  document.getElementById('dEnveloppes').value = 0;
  document.getElementById('depResultat').innerHTML = '';
  alert('✅ Dépouillement enregistré pour ' + nomEntite);
}

function ajouterDepenseGenerale() {
  if (!isAdmin()) return alert('Réservé admin');
  var fc = parseFloat(document.getElementById('dgFC').value) || 0;
  var usd = parseFloat(document.getElementById('dgUSD').value) || 0;
  var motif = document.getElementById('dgMotif').value.trim();
  if (!motif) return alert('Motif obligatoire');
  if (fc === 0 && usd === 0) return alert('Entrez au moins un montant');
  var list = DB.get('depensesGenerales', []);
  list.push({ id: uid(), fc: fc, usd: usd, motif: motif, date: new Date().toLocaleDateString('fr-FR') });
  DB.set('depensesGenerales', list);
  document.getElementById('dgFC').value = 0;
  document.getElementById('dgUSD').value = 0;
  document.getElementById('dgMotif').value = '';
  afficherDepensesGen();
  alert('✅ Dépense ajoutée');
}

function afficherDepensesGen() {
  var list = DB.get('depensesGenerales', []);
  var box = document.getElementById('listeDepensesGen');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucune dépense.</p>'; return; }
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Date</th><th>Motif</th><th>FC</th><th>USD</th><th>Actions</th></tr></thead><tbody>';
  list.forEach(function(d) {
    html += '<tr><td>' + d.date + '</td><td>' + echapper(d.motif) + '</td><td class="num">' + d.fc.toLocaleString() + '</td><td class="num">' + d.usd.toLocaleString() + '</td>';
    html += '<td><button class="btn-mini danger" onclick="supprimerDepenseGen(\'' + d.id + '\')">🗑️</button></td></tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

function supprimerDepenseGen(id) {
  if (!isAdmin()) return alert('Réservé admin');
  if (!confirm('⚠️ Supprimer cette dépense ?')) return;
  DB.set('depensesGenerales', DB.get('depensesGenerales', []).filter(function(x) { return x.id !== id; }));
  afficherDepensesGen();
}

function sumDepouillement(d) {
  var sum = function(arr) { return (arr || []).reduce(function(a, o) { return { fc: a.fc + o.fc, usd: a.usd + o.usd }; }, { fc: 0, usd: 0 }); };
  var i = sum(d.init), s = sum(d.sorei), k = sum(d.kannon), p = sum(d.photo), g = sum(d.gosh), m = sum(d.mita);
  var totFC = (d.constrFC || 0) + (d.normFC || 0) + i.fc + s.fc + k.fc + p.fc + g.fc + m.fc;
  var totUSD = (d.constrUSD || 0) + (d.normUSD || 0) + i.usd + s.usd + k.usd + p.usd + g.usd + m.usd;
  return { totFC: totFC, totUSD: totUSD, soldeFC: totFC - (d.transFC || 0), soldeUSD: totUSD - (d.transUSD || 0), i: i, s: s, k: k, p: p, g: g, m: m };
}

function rapportDepGlobal() {
  var deps = DB.get('depouillements', []);
  var gen = DB.get('depensesGenerales', []);
  var totalFC = 0, totalUSD = 0, soldeFC = 0, soldeUSD = 0;
  deps.forEach(function(d) { var s = sumDepouillement(d); totalFC += s.totFC; totalUSD += s.totUSD; soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; });
  var genFC = gen.reduce(function(a, x) { return a + x.fc; }, 0);
  var genUSD = gen.reduce(function(a, x) { return a + x.usd; }, 0);

  var html = '<div class="rapport-header"><h3>📊 RAPPORT GLOBAL — DÉPOUILLEMENT</h3></div>';
  html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Rubrique</th><th>FC</th><th>USD</th></tr></thead><tbody>';
  html += '<tr><td>Entités dépouillées</td><td colspan="2" class="num">' + deps.length + '</td></tr>';
  html += '<tr><td>Total offrandes</td><td class="num">' + totalFC.toLocaleString() + '</td><td class="num">' + totalUSD.toLocaleString() + '</td></tr>';
  html += '<tr><td>Solde entités</td><td class="num">' + soldeFC.toLocaleString() + '</td><td class="num">' + soldeUSD.toLocaleString() + '</td></tr>';
  html += '<tr><td>Dépenses générales</td><td class="num">- ' + genFC.toLocaleString() + '</td><td class="num">- ' + genUSD.toLocaleString() + '</td></tr>';
  html += '</tbody><tfoot><tr><td>À TRANSFÉRER</td><td class="num">' + (soldeFC - genFC).toLocaleString() + ' FC</td><td class="num">' + (soldeUSD - genUSD).toLocaleString() + ' $</td></tr></tfoot></table></div>';
  document.getElementById('rapportDepBox').innerHTML = html;
}

function rapportDepDetaille() {
  var deps = DB.get('depouillements', []);
  if (!deps.length) { document.getElementById('rapportDepBox').innerHTML = '<p>Aucun dépouillement.</p>'; return; }
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — DÉPOUILLEMENT</h3></div>';
  deps.forEach(function(d) {
    var s = sumDepouillement(d);
    html += '<div class="entity-block">';
    html += '<h4>🏛️ ' + echapper(d.typeEntite) + ' - ' + echapper(d.nomEntite) + ' — ' + d.mois + ' ' + d.annee + '</h4>';
    html += '<div class="table-wrapper"><table class="data-table"><tbody>';
    html += '<tr><td>Construction</td><td class="num">' + d.constrFC.toLocaleString() + ' FC</td><td class="num">' + d.constrUSD.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Normales</td><td class="num">' + d.normFC.toLocaleString() + ' FC</td><td class="num">' + d.normUSD.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Initiation</td><td class="num">' + s.i.fc.toLocaleString() + ' FC</td><td class="num">' + s.i.usd.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Sorei</td><td class="num">' + s.s.fc.toLocaleString() + ' FC</td><td class="num">' + s.s.usd.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Kannon</td><td class="num">' + s.k.fc.toLocaleString() + ' FC</td><td class="num">' + s.k.usd.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Photo</td><td class="num">' + s.p.fc.toLocaleString() + ' FC</td><td class="num">' + s.p.usd.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Goshintai</td><td class="num">' + s.g.fc.toLocaleString() + ' FC</td><td class="num">' + s.g.usd.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Mitamaya</td><td class="num">' + s.m.fc.toLocaleString() + ' FC</td><td class="num">' + s.m.usd.toLocaleString() + ' $</td></tr>';
    html += '</tbody><tfoot>';
    html += '<tr><td>TOTAL</td><td class="num">' + s.totFC.toLocaleString() + ' FC</td><td class="num">' + s.totUSD.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>Transport</td><td class="num">- ' + d.transFC.toLocaleString() + ' FC</td><td class="num">- ' + d.transUSD.toLocaleString() + ' $</td></tr>';
    html += '<tr><td>SOLDE</td><td class="num">' + s.soldeFC.toLocaleString() + ' FC</td><td class="num">' + s.soldeUSD.toLocaleString() + ' $</td></tr>';
    html += '</tfoot></table></div></div>';
  });
  document.getElementById('rapportDepBox').innerHTML = html;
}

function soldeTransferer() {
  var deps = DB.get('depouillements', []);
  var gen = DB.get('depensesGenerales', []);
  var soldeFC = 0, soldeUSD = 0;
  deps.forEach(function(d) { var s = sumDepouillement(d); soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; });
  var genFC = gen.reduce(function(a, x) { return a + x.fc; }, 0);
  var genUSD = gen.reduce(function(a, x) { return a + x.usd; }, 0);
  var html = '<div class="rapport-header"><h3>🏦 SOLDE À TRANSFÉRER</h3></div>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Solde entités</td><td class="num">' + soldeFC.toLocaleString() + ' FC</td><td class="num">' + soldeUSD.toLocaleString() + ' $</td></tr>';
  html += '<tr><td>Dépenses générales</td><td class="num">- ' + genFC.toLocaleString() + ' FC</td><td class="num">- ' + genUSD.toLocaleString() + ' $</td></tr>';
  html += '</tbody><tfoot><tr><td>À LA BANQUE</td><td class="num">' + (soldeFC - genFC).toLocaleString() + ' FC</td><td class="num">' + (soldeUSD - genUSD).toLocaleString() + ' $</td></tr></tfoot></table></div>';
  document.getElementById('rapportDepBox').innerHTML = html;
}

// ========== TABLEAU DE BORD & RAPPORT GÉNÉRAL ==========
function afficherDashboard() {
  var box = document.getElementById('dashboardBox');
  if (!box) return;
  var entites = DB.get('entites', []).length;
  var parts = DB.get('participations', []);
  var totPart = parts.reduce(function(a, p) { return a + p.m + p.s + p.n; }, 0);
  var fiches = DB.get('fichesMensuelles', []).length;
  var cands = DB.get('candidats', []).filter(function(c) { return c.statut !== 'archive'; });
  var totalVerse = cands.reduce(function(a, c) { return a + (c.totalVerse || 0); }, 0);
  var deps = DB.get('depouillements', []);
  var soldeDepFC = 0, soldeDepUSD = 0;
  deps.forEach(function(d) { var s = sumDepouillement(d); soldeDepFC += s.soldeFC; soldeDepUSD += s.soldeUSD; });

  var html = '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><th colspan="2">📈 MODULE I — FRÉQUENCES</th></tr>';
  html += '<tr><td>Entités enregistrées</td><td class="num">' + entites + '</td></tr>';
  html += '<tr><td>Total présences</td><td class="num">' + totPart + '</td></tr>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches + '</td></tr>';
  html += '<tr><th colspan="2">💰 MODULE II — FINANCE</th></tr>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr>';
  html += '<tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + ' $</td></tr>';
  html += '<tr><th colspan="2">🧾 MODULE III — DÉPOUILLEMENT</th></tr>';
  html += '<tr><td>Entités dépouillées</td><td class="num">' + deps.length + '</td></tr>';
  html += '<tr><td>Solde total FC</td><td class="num">' + soldeDepFC.toLocaleString() + ' FC</td></tr>';
  html += '<tr><td>Solde total USD</td><td class="num">' + soldeDepUSD.toLocaleString() + ' $</td></tr>';
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

function rapportGeneralConsolide() {
  var box = document.getElementById('rapportGeneralBox');
  var html = '<div class="rapport-header"><h3>🌍 RAPPORT GÉNÉRAL CONSOLIDÉ</h3><p>EMM MONDIAL — Tous Modules</p></div>';
  html += '<p style="text-align:center;font-size:12px;color:#666;margin-bottom:14px">Généré par <strong>' + echapper(currentUser ? currentUser.nom : '') + '</strong> le ' + new Date().toLocaleString('fr-FR') + '</p>';

  var entites = DB.get('entites', []).length;
  var parts = DB.get('participations', []);
  var tm = 0, ts = 0, tn = 0;
  parts.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });

  html += '<h4 style="color:#0a6e2c;margin:14px 0 8px">📈 MODULE I — FRÉQUENCES</h4>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Entités</td><td class="num">' + entites + '</td></tr>';
  html += '<tr><td>Membres</td><td class="num">' + tm + '</td></tr>';
  html += '<tr><td>Sympathisants</td><td class="num">' + ts + '</td></tr>';
  html += '<tr><td>Nouveaux venus</td><td class="num">' + tn + '</td></tr>';
  html += '</tbody></table></div>';

  var cands = DB.get('candidats', []).filter(function(c) { return c.statut !== 'archive'; });
  var totalVerse = 0, totalPrevu = 0;
  cands.forEach(function(c) { totalVerse += c.totalVerse || 0; totalPrevu += c.montantPrevu; });

  html += '<h4 style="color:#0a6e2c;margin:20px 0 8px">💰 MODULE II — FINANCE</h4>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Candidats actifs</td><td class="num">' + cands.length + '</td></tr>';
  html += '<tr><td>Total prévu</td><td class="num">' + totalPrevu.toFixed(2) + '$</td></tr>';
  html += '<tr><td>Total versé</td><td class="num">' + totalVerse.toFixed(2) + '$</td></tr>';
  html += '<tr><td>Solde</td><td class="num">' + (totalPrevu - totalVerse).toFixed(2) + '$</td></tr>';
  html += '</tbody></table></div>';

  var deps = DB.get('depouillements', []);
  var gen = DB.get('depensesGenerales', []);
  var soldeFC = 0, soldeUSD = 0;
  deps.forEach(function(d) { var s = sumDepouillement(d); soldeFC += s.soldeFC; soldeUSD += s.soldeUSD; });
  var genFC = gen.reduce(function(a, x) { return a + x.fc; }, 0);
  var genUSD = gen.reduce(function(a, x) { return a + x.usd; }, 0);

  html += '<h4 style="color:#0a6e2c;margin:20px 0 8px">🧾 MODULE III — DÉPOUILLEMENT</h4>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Entités dépouillées</td><td class="num">' + deps.length + '</td></tr>';
  html += '<tr><td>Solde FC</td><td class="num">' + soldeFC.toLocaleString() + ' FC</td></tr>';
  html += '<tr><td>Solde USD</td><td class="num">' + soldeUSD.toLocaleString() + ' $</td></tr>';
  html += '<tr><td>Dépenses FC</td><td class="num">- ' + genFC.toLocaleString() + ' FC</td></tr>';
  html += '<tr><td>Dépenses USD</td><td class="num">- ' + genUSD.toLocaleString() + ' $</td></tr>';
  html += '</tbody><tfoot><tr><td>À TRANSFÉRER</td><td class="num">' + (soldeFC - genFC).toLocaleString() + ' FC / ' + (soldeUSD - genUSD).toLocaleString() + ' $</td></tr></tfoot></table></div>';

  box.innerHTML = html;
}

// ========== IMPRESSIONS RAPPORTS ==========
function imprimerRapportFreq() {
  var contenu = document.getElementById('rapportFreqBox').innerHTML;
  if (!contenu) return alert('Générez d\'abord un rapport');
  var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Rapport</title><style>body{font-family:Arial;padding:20px}h3,h4{color:#0a6e2c}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body>');
  w.document.write('<h1 style="text-align:center;color:#0a6e2c">EMM MONDIAL</h1><hr>');
  w.document.write(contenu);
  w.document.write('</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 600);
}
function imprimerRapportFin() { var c = document.getElementById('rapportFinBox').innerHTML; if(!c) return alert('Rapport vide'); var w=window.open('','_blank'); w.document.write('<html><head><meta charset="UTF-8"><title>Rapport</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body><h1 style="text-align:center;color:#0a6e2c">EMM MONDIAL</h1><hr>'+c+'</body></html>'); w.document.close(); setTimeout(function(){w.print();},600); }
function imprimerRapportDep() { var c = document.getElementById('rapportDepBox').innerHTML; if(!c) return alert('Rapport vide'); var w=window.open('','_blank'); w.document.write('<html><head><meta charset="UTF-8"><title>Rapport</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body><h1 style="text-align:center;color:#0a6e2c">EMM MONDIAL</h1><hr>'+c+'</body></html>'); w.document.close(); setTimeout(function(){w.print();},600); }
function imprimerGeneral() { var c = document.getElementById('rapportGeneralBox').innerHTML; if(!c) return alert('Rapport vide'); var w=window.open('','_blank'); w.document.write('<html><head><meta charset="UTF-8"><title>Rapport</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body><h1 style="text-align:center;color:#0a6e2c">EMM MONDIAL</h1><hr>'+c+'</body></html>'); w.document.close(); setTimeout(function(){w.print();},600); }

function exporterWordFreq() { exporterWordBox('rapportFreqBox','Frequence'); }
function exporterWordFin() { exporterWordBox('rapportFinBox','Finance'); }
function exporterWordDep() { exporterWordBox('rapportDepBox','Depouillement'); }
function exporterWordGeneral() { exporterWordBox('rapportGeneralBox','General'); }

function exporterWordBox(boxId, nom) {
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>';
  html += '<h1 style="text-align:center;color:#0a6e2c">EMM MONDIAL</h1><hr>';
  html += contenu;
  html += '</body></html>';
  var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Rapport_' + nom + '_' + Date.now() + '.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

function exporterPDFFreq() { exporterPDFBox('rapportFreqBox'); }
function exporterPDFFin() { exporterPDFBox('rapportFinBox'); }
function exporterPDFDep() { exporterPDFBox('rapportDepBox'); }
function exporterPDFGeneral() { exporterPDFBox('rapportGeneralBox'); }

function exporterPDFBox(boxId) {
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>PDF</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body><h1 style="text-align:center;color:#0a6e2c">EMM MONDIAL</h1><hr>'+contenu+'</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 800);
}

function partagerRapportFreq() { partagerBox('rapportFreqBox','Fréquences'); }
function partagerRapportFin() { partagerBox('rapportFinBox','Finance'); }
function partagerRapportDep() { partagerBox('rapportDepBox','Dépouillement'); }
function partagerGeneral() { partagerBox('rapportGeneralBox','Général'); }

function partagerBox(boxId, nom) {
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var div = document.createElement('div');
  div.innerHTML = contenu;
  var texte = div.innerText.substring(0, 2000);
  var msg = 'EMM MONDIAL — Rapport ' + nom + '\n\n' + texte;
  if (navigator.share) {
    navigator.share({ title: 'Rapport EMM', text: msg }).catch(function(err) {
      if (err.name !== 'AbortError') partagerFallback(msg);
    });
  } else partagerFallback(msg);
}

function partagerFallback(msg) {
  var email = prompt('📧 Email (vide = WhatsApp) :', '');
  if (email === null) return;
  if (email.trim()) window.location.href = 'mailto:' + email.trim() + '?subject=Rapport EMM&body=' + encodeURIComponent(msg);
  else window.location.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
}

// ========== UTILISATEURS (ADMIN) ==========
function ajouterUtilisateur() {
  if (!isAdmin()) return alert('Réservé admin');
  var nom = document.getElementById('uNom').value.trim().toLowerCase();
  var pass = document.getElementById('uPass').value.trim();
  var role = document.getElementById('uRole').value;
  if (!nom || !pass) return alert('Remplissez tous les champs');
  var users = DB.get('users', []);
  if (users.find(function(u) { return u.nom === nom; })) return alert('Ce nom existe déjà');
  users.push({ id: uid(), nom: nom, pass: pass, role: role });
  DB.set('users', users);
  document.getElementById('uNom').value = '';
  document.getElementById('uPass').value = '';
  afficherUtilisateurs();
  alert('✅ Utilisateur ajouté');
}

function afficherUtilisateurs() {
  var users = DB.get('users', []);
  var box = document.getElementById('listeUtilisateurs');
  if (!box) return;
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>Rôle</th></tr></thead><tbody>';
  users.forEach(function(u) {
    html += '<tr><td>' + echapper(u.nom) + '</td><td>' + (u.role === 'admin' ? '👑 Admin' : '👤 Utilisateur') + '</td></tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

// ========== EXPORT / IMPORT ==========
function exporterDonnees() {
  var data = {};
  ['users','entites','participations','fichesMensuelles','candidats','versements','depouillements','depensesGenerales','annonces'].forEach(function(k) { data[k] = DB.get(k, []); });
  var json = JSON.stringify(data, null, 2);
  try {
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'emm_mondial_' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    alert('✅ Fichier téléchargé');
  } catch (e) { alert('Erreur export'); }
}

function restaurerTexte() {
  var txt = document.getElementById('importText').value.trim();
  if (!txt) return alert('Collez d\'abord un JSON');
  try {
    var data = JSON.parse(txt);
    Object.keys(data).forEach(function(k) { DB.set(k, data[k]); });
    alert('✅ Données restaurées');
    refreshAll();
    afficherDashboard();
    document.getElementById('importText').value = '';
  } catch (e) { alert('❌ JSON invalide'); }
}

function importerDonnees(ev) {
  var file = ev.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      Object.keys(data).forEach(function(k) { DB.set(k, data[k]); });
      alert('✅ Données restaurées');
      refreshAll();
      afficherDashboard();
    } catch (err) { alert('❌ Fichier invalide'); }
  };
  reader.readAsText(file);
}

function toutEffacer() {
  if (!isAdmin()) return alert('Réservé admin');
  if (!confirm('⚠️ Effacer TOUTES les données (sauf utilisateurs) ?')) return;
  var users = DB.get('users', []);
  localStorage.clear();
  DB.set('users', users);
  initDB();
  alert('✅ Effacé');
  location.reload();
}

// ========== PWA INSTALL ==========
var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  var btn = document.getElementById('installBtn');
  if (btn) btn.style.display = 'block';
});

function installApp() {
  if (!deferredPrompt) return alert('Utilisez le menu navigateur → "Ajouter à l\'écran d\'accueil"');
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function() {
    deferredPrompt = null;
    var btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
  });
}

// ========== INITIALISATION ==========
window.addEventListener('load', function() {
  showSplash();
});