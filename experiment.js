// OVERVIEW -----------------------------------------------------------------------------
//
// TODO:
// 
// dirty hack to lock scrolling ---------------------------------------------------------
// note that jquery needs to be loaded.
$('body').css({'overflow':'hidden'});
  $(document).bind('scroll',function () { 
       window.scrollTo(0,0); 
  });

// safari & ie exclusion ----------------------------------------------------------------
var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var is_ie = /*@cc_on!@*/false || !!document.documentMode;

var is_compatible = !(is_safari || is_ie);


if(!is_compatible) {

    var safari_exclusion = {
        type: "html-keyboard-response",
        stimulus:
        "<p>Cette étude n'est pas compatible avec votre moteur de recherche.</p>" +
        "<p>Essayez de nouveau avec un moteur de recherche compatible (p. ex. Google Chrome ou Firefox).</p>",
        choices: jsPsych.NO_KEYS
    };

    var timeline_safari = [];

    timeline_safari.push(safari_exclusion);
    jsPsych.init({timeline: timeline_safari});

}

// firebase initialization ---------------------------------------------------------------
  var firebase_config = {
    apiKey: "AIzaSyBwDr8n-RNCbBOk1lKIxw7AFgslXGcnQzM",
    databaseURL: "https://marineexpe.firebaseio.com/"
  };

  firebase.initializeApp(firebase_config);
  var database = firebase.database();

  // id variables
    var jspsych_id = jsPsych.data.getURLVariable("jspsych_id");
    var vaast_condition_approach = jsPsych.data.getURLVariable("vaast_condition_approach");

    if(jspsych_id == null) {jspsych_id = "999";}

  // connection status ---------------------------------------------------------------------
  // This section ensure that we don't lose data. Anytime the 
  // client is disconnected, an alert appears onscreen
  var connectedRef = firebase.database().ref(".info/connected");
  var connection   = firebase.database().ref("IAT_FrMg/" + jspsych_id + "/")
  var dialog = undefined;
  var first_connection = true;

  connectedRef.on("value", function(snap) {
    if (snap.val() === true) {
      connection
        .push()
        .set({status: "connection",
              timestamp: firebase.database.ServerValue.TIMESTAMP})

      connection
        .push()
        .onDisconnect()
        .set({status: "disconnection",
              timestamp: firebase.database.ServerValue.TIMESTAMP})

    if(!first_connection) {
      dialog.modal('hide');
    }
    first_connection = false;
    } else {
      if(!first_connection) {
      dialog = bootbox.dialog({
          title: 'Connection lost',
          message: '<p><i class="fa fa-spin fa-spinner"></i> Please wait while we try to reconnect.</p>',
          closeButton: false
          });
    }
    }
  });

    // counter variables
  var iat_trial_n      = 1;
  var browser_events_n = 1;

// Variable input -----------------------------------------------------------------------
// Variable used to define experimental condition.

var iat_good    = jsPsych.randomization.sampleWithoutReplacement(["left", "right"], 1)[0];; // either "left" or "right"
var iat_black_1 = jsPsych.randomization.sampleWithoutReplacement(["left", "right"], 1)[0];; // either "left" or "right"

 // cursor helper functions
var hide_cursor = function() {
	document.querySelector('head').insertAdjacentHTML('beforeend', '<style id="cursor-toggle"> html { cursor: none; } </style>');
}
var show_cursor = function() {
	document.querySelector('#cursor-toggle').remove();
}

var hiding_cursor = {
    type: 'call-function',
    func: hide_cursor
}

var showing_cursor = {
    type: 'call-function',
    func: show_cursor
}


// Saving blocks ------------------------------------------------------------------------
// Every function here send the data to keen.io. Because data sent is different according
// to trial type, there are differents function definition.

// init ---------------------------------------------------------------------------------
  var saving_id = function(){
     database
        .ref("participant_id_IAT_FrMg/")
        .push()
        .set({jspsych_id: jspsych_id,
               iat_good_side: iat_good,
               iat_black_1_side: iat_black_1,
               timestamp: firebase.database.ServerValue.TIMESTAMP})
  }

  // iat trial ----------------------------------------------------------------------------
  var saving_iat_trial = function(){
    database
      .ref("iat_trial_FrMg/")
      .push()
      .set({jspsych_id: jspsych_id,
          iat_good_side: iat_good,
          iat_black_1_side: iat_black_1,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          iat_trial_data: jsPsych.data.get().last().json()})
  }

// demographic logging ------------------------------------------------------------------

  var saving_browser_events = function(completion) {
    database
     .ref("browser_event_IAT_FrMg/")
     .push()
     .set({jspsych_id: jspsych_id,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      iat_good_side: iat_good,
      completion: completion,
      event_data: jsPsych.data.getInteractionData().json()})
  }

  var saving_extra = function() {
    database
     .ref("extra_info_IAT_FrMg/")
     .push()
     .set({jspsych_id: jspsych_id,
         timestamp: firebase.database.ServerValue.TIMESTAMP,
         extra_data: jsPsych.data.get().last(7).json(),  //it was 7 before 4: check if it works
        })
  }


// saving blocks ------------------------------------------------------------------------
var save_id = {
    type: 'call-function',
    func: saving_id
}

var save_iat_trial = {
    type: 'call-function',
    func: saving_iat_trial
}
var save_extra = {
    type: 'call-function',
    func: saving_extra
}


// iat sampling function ----------------------------------------------------------------
var sample_n_iat = function(list, n) {
  list = jsPsych.randomization.sampleWithoutReplacement(list, n);
  list = jsPsych.randomization.shuffleNoRepeats(list);

  return(list);
}

// EXPERIMENT ---------------------------------------------------------------------------

// Switching to fullscreen --------------------------------------------------------------
var fullscreen_trial = {
  type: 'fullscreen',
  message:  'Pour commencer la Tâche 3, merci de vous mettre en mode plein écran en cliquant ici. </br></br>',
  button_label: 'Passer au plein écran',
  fullscreen_mode: true
}


// IAT -----------------------------------------------------------------------------------
// IAT variable initialization ----------------------------------------------------------
// Correct responses -----------------------
var good_side      = undefined;
var bad_side     = undefined;
var black_side_1st = undefined;
var white_side_1st  = undefined;
var black_side_2nd = undefined;
var white_side_2nd  = undefined;

// Label -----------------------------------
var block_1_left_label          = undefined;
var block_1_right_label         = undefined;
var block_2_left_label          = undefined;
var block_2_right_label         = undefined;
var block_3_left_label_top      = undefined;
var block_3_right_label_top     = undefined;
var block_3_left_label_bottom   = undefined;
var block_3_right_label_bottom  = undefined;
var block_4_left_label          = undefined;
var block_4_right_label         = undefined;
var block_5_left_label_top      = undefined;
var block_5_right_label_top     = undefined;
var block_5_left_label_bottom   = undefined;
var block_5_right_label_bottom  = undefined;

switch(iat_good) {
  case "left":
        good_side               = "left";
        bad_side              = "right";

        block_2_left_label      = "BON";
        block_2_right_label     = "MAUVAIS";
        block_3_left_label_top  = "BON";
        block_3_right_label_top = "MAUVAIS";
        block_5_left_label_top  = "BON";
        block_5_right_label_top = "MAUVAIS";

    break;

  case "right":
        good_side               = "right";
        bad_side              = "left";

        block_2_left_label      = "MAUVAIS";
        block_2_right_label     = "BON";
        block_3_left_label_top  = "MAUVAIS";
        block_3_right_label_top = "BON";
        block_5_left_label_top  = "MAUVAIS";
        block_5_right_label_top = "BON";

    break;
}

switch(iat_black_1) {
  case "left":
      black_side_1st = "left";
      white_side_1st  = "right";
      black_side_2nd = "right";
      white_side_2nd  = "left";

    block_1_left_label          = "Maghrébin";
    block_1_right_label         = "Belge";
    block_3_left_label_bottom   = "Maghrébin";
    block_3_right_label_bottom  = "Belge";
    block_4_left_label          = "Belge";
    block_4_right_label         = "Maghrébin";
    block_5_left_label_bottom   = "Belge";
    block_5_right_label_bottom  = "Maghrébin";

    break;

  case "right":
        black_side_1st = "right";
        white_side_1st  = "left";
        black_side_2nd = "left";
        white_side_2nd  = "right";

    block_1_left_label          = "Belge";
    block_1_right_label         = "Maghrébin";
    block_3_left_label_bottom   = "Belge";
    block_3_right_label_bottom  = "Maghrébin";
    block_4_left_label          = "Maghrébin";
    block_4_right_label         = "Belge";
    block_5_left_label_bottom   = "Maghrébin";
    block_5_right_label_bottom  = "Belge";

    break;
}


// To alternate good/bad and black/white trials ---------------------------------------------------------------------
var shuffleIATstims = function (stims) {
    // Alterenate categories blackWhite vs. goodBad
    var n = stims.length / 2;
    var chunkedStims = _.chunk(stims, n);
    var stims1 = jsPsych.randomization.shuffleNoRepeats(chunkedStims[0]);
    var stims2 = jsPsych.randomization.shuffleNoRepeats(chunkedStims[1]);

    var stims12 = stims1.map(function (e, i) { // merge two arrays so that the values alternate
        return [e, stims2[i]];
    });
    var stims21 = stims2.map(function (e, i) {
        return [e, stims1[i]];
    });

    var t = _.sample([stims12, stims21]);
    t = _.flattenDeep(t);

    return t;
};


// iat instructions ---------------------------------------------------------------------

var iat_instructions_1 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'>Tâche 3 : Tâche de catégorisation</h1>" +
    "<p class='instructions'>Dans cette tâche, vous devrez catégoriser des mots et des prénoms" +
    " aussi vite que possible en utilisant des touches de votre clavier. Sur la page suivante, nous allons vous présenter" +
    " des catégories et les mots ou prénoms appartenant à chacune de ces catégories." +
    "</p>" +
    "<p class='instructions'>Comme vous le verrez, vous devrez catégoriser" +
    " des mots en fonction de leur appartenance à la catégorie Bon ou Mauvais" +
    " et des prénoms en fonction de leur origine maghrébine vs. belge (francophone).</p>" +
    "<h3 class='instructions'>Instructions</h3>" +
    "<ul class='instructions'>" +
      "<li>Merci de garder vos indexes sur les touches <span class='key'>E</span> et <span class='key'>I</span> pour permettre des réponses rapides.</li>" +
      "<li>Les noms des catégories affichées en haut de votre écran vous indiqueront quel mot/prénom va avec quel touche de réponse. </li>" +
      "<li>Merci de répondre aussi vite que possible.</li>" +
    "</ul>" +
    "<p>&nbsp;</p>" +
    "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span>" +
    " pour continuer.</p>",
  choices: [32]
};

var iat_instructions_1_1 = {
  type: "html-keyboard-response",
  stimulus:
    "<h1 class ='custom-title'>Tâche 3 : Tâche de catégorisation</h1>" +
    "<p class='instructions'><center>Voici les 4 catégories et les mots ou prénoms appartenant à chacune de ces catégories</center></p>" +
    "<table>" +
      "<tr>" +
        "<th width='200px'>Catégorie</th>" +
        "<th align='left'>Mot/prénom</th>" +
      "</tr>" +
      "<tr>" +
        "<td>Bon</td>" +
        "<td align='left'>amour, magnifique, plaisir, rires, merveilleux, joie, heureux, paix, liberté, vacances</td>" +
      "</tr>" +
      "<tr>" +
        "<td>Mauvais</td>" +
        "<td align='left'>blessure, épouvantable, horrible, mal, affreux, échec, méchant, douleur, prison, malade</td>" +
      "</tr>" +
      "<tr>" +
      "<br>"+
        "<td>Belge</td>" +
        "<td align='left'>Benoît, Thibault, Blaise, Bastien, Gautier, Rémy, Matthieu, Fabrice, Sylvain, Clément</td>" +
      "</tr>" +
      "<tr>" +
        "<td>Maghrébin</td>" +
        "<td align='left'>Mustafa, Aziz, Ali, Farid, Zahir, Youssef, Kader, Hassan, Ahmed, Mohammed</td>" +
      "</tr>" +
    "</table>" +
    "<br>" +
    "<br>" +
    "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span>" +
    " pour continuer.</p>",
  choices: [32]
};



// iat block instructions ---------------------------------------------------------------

var iat_instructions_block_1 = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'> <p>Appuyez sur " +
    "<span class='key'>E</span> pour:<br><span class='iat-category black-white'>" +
    block_1_left_label  +
    "</span></p>" +
    "</div>" +
    "<div style='position: absolute; top: 18%; right: 20%'><p>Appuyez sur " +
    "<span class='key'>I</span> pour:<br><span class='iat-category black-white'>" +
    block_1_right_label +
    "</span></p>" +
  "</div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%, width:80%;'> " +
    "<p class='instructions'>" +
    "<br>" +
    "<br>" +
      "Dans cette tâche, vous devrez placer vos indexes sur les touches <span class='key'>E</span> " +
      "et <span class='key'>I</span> de votre clavier. Les prénoms associés aux catégories ci-dessous " +
      "apparaîtront au centre de votre écran. " +
      "Lorsque le prénom appartient à la catégorie en haut à gauche, appuyez sur la touche <span class='key'>E</span> et lorsque le " +
      "prénom appartient à la catégorie en haut à droite, appuyez sur la touche <span class='key'>I</span>. Les prénoms appartiennent seulement à une catégorie. " +
      "Si vous faites une erreur un X rouge apparaîtra. Il faudra alors corriger votre erreur en appuyant sur l'autre touche." +
    "</p>" +
    "<p class='instructions'>" +
      "Merci d'aller AUSSI VITE QUE POSSIBLE tout en faisant le moins d'erreurs possibles. " +
    "</p>" +
  "</div> " +
  "<br>" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

var iat_instructions_block_2 = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'> <p>Appuyez sur " +
    "<span class='key'>E</span> pour:<br><span class='iat-category good-bad'>" +
    block_2_left_label  +
    "</span></p>" +
    "</div>" +
    "<div style='position: absolute; top: 18%; right: 20%'><p>Appuyez sur " +
    "<span class='key'>I</span> pour:<br><span class='iat-category good-bad'>" +
    block_2_right_label +
    "</span></p>" +
  "</div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%, width:80%;'> " +
    "<p class='instructions'>" +
    "<br>" +
      "Comme vous pouvez le voir ci-dessus, les catégories ont changé. Les mots à catégoriser changent également. " +
      "Les règles, cependant, restent les mêmes." +
    "</p>" +
    "<p class='instructions'>" +
      "Quand les mots appartiennent à la catégorie de gauche, appuyez sur <span class='key'>E</span>; " +
      "Quand les mots appartiennent à la catégorie de droite, appuyez sur <span class='key'>I</span>. " +
      "Les mots appartiennent seulement à une catégorie. " +
      "Si vous faites une erreur un X rouge apparaîtra. Il faudra alors corriger votre erreur en appuyant sur l'autre touche. " +
      "Merci d'aller AUSSI VITE QUE POSSIBLE tout en faisant le moins d'erreurs possibles. " +
    "</p>" +
  "</div> " +
  "<br>" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

var iat_instructions_block_3 = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'><p>" +
    "Appuyez sur <span class='key'>E</span> pour:<br> " +
    "<span class='iat-category good-bad'>" + block_3_left_label_top  + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_3_left_label_bottom + "</span>" +
  "</p></div>" +
  "<div style='position: absolute; top: 18%; right: 20%'><p>" +
    "Appuyez sur <span class='key'>I</span>  pour:<br>" +
    "<span class='iat-category good-bad'>" + block_3_right_label_top + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_3_right_label_bottom  + "</span>" +
  "</p></div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%'> "+
    "<p class='instructions'>" +
    "<br>" +
    "<br>" +
    "<br>" +
    "Comme vous pouvez le voir ci-dessus, les 4 catégories que vous avez vues précédemment apparaissent maintenant ensemble. " +
    "Rappelez-vous que chaque mot/prénom appartient à une seule catégorie." +
    "</p>" +
    "<p class='instructions'>" +
    "La couleur des mots/prénoms (<span class='black-white'>verte</span> et <span class='good-bad'>noire</span>) peut vous aider à " +
    "identifier la catégorie appropriée pour chaque mot/prénom. " +
    "Utilisez les touches <span class='key'>E</span> et <span class='key'>I</span> pour catégoriser " +
    "les mots ou les prénoms dans les catégories de gauche et de droite, et corrigez vos erreurs en appuyant sur l'autre touche de réponse." +
    "</p>" +
  "</div> " +
  "<br />" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

var iat_instructions_block_3_test = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'><p>" +
    "Appuyez sur <span class='key'>E</span> pour:<br> " +
    "<span class='iat-category good-bad'>" + block_3_left_label_top  + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_3_left_label_bottom + "</span>" +
  "</p></div>" +
  "<div style='position: absolute; top: 18%; right: 20%'><p>" +
    "Appuyez sur <span class='key'>I</span>  pour:<br>" +
    "<span class='iat-category good-bad'>" + block_3_right_label_top + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_3_right_label_bottom  + "</span>" +
  "</p></div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%'> "+
    "<p class='instructions'>" +
    "Vous devez classer les mots ou les prénoms dans les mêmes catégories que précédemment. Rappelez-vous d'aller aussi vite que possible " +
    "tout en faisant le moins d'erreurs possible." +
    "</p>" +
    "<p class='instructions'>" +
    "La couleur des mots/prénoms (<span class='black-white'>verte</span> et <span class='good-bad'>noire</span>) peut vous aider à " +
    "identifier la catégorie appropriée pour chaque mot/prénom. " +
    "Utilisez les touches <span class='key'>E</span> et <span class='key'>I</span> pour catégoriser " +
    "les mots ou les prénoms dans les catégories de gauche et de droite, et corrigez vos erreurs en appuyant sur l'autre touche de réponse." +
    "</p>" +
  "</div> " +
  "<br />" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

var iat_instructions_block_4 = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'> <p>Appuyez sur " +
    "<span class='key'>E</span> pour:<br><span class='iat-category black-white'>" +
    block_4_left_label  +
    "</span></p>" +
    "</div>" +
    "<div style='position: absolute; top: 18%; right: 20%'><p>Appuyez sur " +
    "<span class='key'>I</span> pour:<br><span class='iat-category black-white'>" +
    block_4_right_label +
    "</span></p>" +
  "</div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%, width:80%;'> " +
    "<p class='instructions'>" +
      "Comme vous pouvez le voir ci-dessus, il y a seulement 2 catégories et celles-ci on échangé leur position. " +
      "La catégorie qui était précédemment sur la gauche est maintenant sur la droite et la catégorie qui était sur la droite " +
      "est maintenant sur la gauche. Vous allez vous entrainer avec cette nouvelle configuration."  +
    "</p>" +
    "<p class='instructions'>" +
      "Utilisez les touches <span class='key'>E</span> et <span class='key'>I</span> " +
      "pour catégoriser les prénoms, et corriger vos erreurs " +
      "en appuyant sur l'autre touche." +
    "</p>" +
  "</div> " +
  "<br>" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

var iat_instructions_block_5 = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'><p>" +
    "Appuyez sur <span class='key'>E</span> pour:<br> " +
    "<span class='iat-category good-bad'>" + block_5_left_label_top  + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_5_left_label_bottom + "</span>" +
  "</p></div>" +
  "<div style='position: absolute; top: 18%; right: 20%'><p>" +
    "Appuyez sur <span class='key'>I</span> pour:<br>" +
    "<span class='iat-category good-bad'>" + block_5_right_label_top + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_5_right_label_bottom  + "</span>" +
  "</p></div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%'> "+
    "<p class='instructions'>" +
    "<br>" +
    "Comme vous pouvez le voir ci-dessus, les 4 catégories que vous avez vues précédemment apparaissent maintenant ensemble. " +
    "Rappelez-vous que chaque mot/prénom appartient à une seule catégorie." +
    "</p>" +
    "<p class='instructions'>" +
      "Utilisez les touches <span class='key'>E</span> et <span class='key'>I</span> " +
      "pour catégoriser les mots ou les prénoms, et corriger vos erreurs " +
      "en appuyant sur l'autre touche." +
    "</p>" +
  "</div> " +
  "<br />" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

var iat_instructions_block_5_test = {
  type: 'html-keyboard-response',
  stimulus:
  "<div style='position: absolute; top: 18%; left: 20%'><p>" +
    "Appuyez sur <span class='key'>E</span> pour:<br> " +
    "<span class='iat-category good-bad'>" + block_5_left_label_top  + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_5_left_label_bottom + "</span>" +
  "</p></div>" +
  "<div style='position: absolute; top: 18%; right: 20%'><p>" +
    "Appuyez sur <span class='key'>I</span>  pour:<br>" +
    "<span class='iat-category good-bad'>" + block_5_right_label_top + "</span>" +
    "<br>ou<br>" +
    "<span class='iat-category black-white'>" + block_5_right_label_bottom  + "</span>" +
  "</p></div>" +
  "<div class='iat-instructions' style='position: relative; top: 42%'> "+
    "<p class='instructions'>" +
    "Vous devez classer les mots ou les prénoms dans les mêmes catégories que précédemment. Rappelez-vous d'aller aussi vite que possible " +
    "tout en faisant le moins d'erreurs possible." +
    "</p>" +
    "<p class='instructions'>" +
    "La couleur des mots/prénoms (<span class='black-white'>verte</span> et <span class='good-bad'>noire</span>) peut vous aider à " +
    "identifier la catégorie appropriée pour chaque mot/prénom. " +
    "Utilisez les touches <span class='key'>E</span> et <span class='key'>I</span> pour catégoriser " +
    "les mots ou les prénoms dans les catégories de gauche et de droite, et corrigez vos erreurs en appuyant sur l'autre touche de réponse." +
    "</p>" +
  "</div> " +
  "<br />" +
  "<br>" +
  "<p class = 'continue-instructions'>Appuyez sur <span class='key'>espace</span> pour commencer.</p>",
  choices: [32]
};

// iat - stimuli ------------------------------------------------------------------------


var iat_block_1_stim = [
  {category: "black-white", stimulus: "Mustafa",    stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Aziz",       stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Ali",        stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Farid",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Zahir",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Youssef",    stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Kader",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Hassan",     stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Ahmed",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Mohammed",   stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Benoît",     stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Thibault",   stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Blaise",     stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Bastien",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Gautier",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Rémy",       stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Matthieu",   stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Fabrice",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Sylvain",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Clément",    stim_key_association: white_side_1st}
]

var iat_block_2_stim = [
  {category: "good-bad", stimulus: "amour",         stim_key_association: good_side},
  {category: "good-bad", stimulus: "magnifique",    stim_key_association: good_side},
  {category: "good-bad", stimulus: "plaisir",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "rires",         stim_key_association: good_side},
  {category: "good-bad", stimulus: "merveilleux",   stim_key_association: good_side},
  {category: "good-bad", stimulus: "joie",          stim_key_association: good_side},
  {category: "good-bad", stimulus: "heureux",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "paix",          stim_key_association: good_side},
  {category: "good-bad", stimulus: "liberté",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "vacances",      stim_key_association: good_side},
  {category: "good-bad", stimulus: "blessure",      stim_key_association: bad_side},
  {category: "good-bad", stimulus: "épouvantable",  stim_key_association: bad_side},
  {category: "good-bad", stimulus: "horrible",      stim_key_association: bad_side},
  {category: "good-bad", stimulus: "mal",           stim_key_association: bad_side},
  {category: "good-bad", stimulus: "affreux",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "échec",         stim_key_association: bad_side},
  {category: "good-bad", stimulus: "méchant",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "douleur",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "prison",        stim_key_association: bad_side},
  {category: "good-bad", stimulus: "malade",        stim_key_association: bad_side}
]

var iat_block_3_stim = [
  {category: "good-bad", stimulus: "amour",         stim_key_association: good_side},
  {category: "good-bad", stimulus: "magnifique",    stim_key_association: good_side},
  {category: "good-bad", stimulus: "plaisir",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "rires",         stim_key_association: good_side},
  {category: "good-bad", stimulus: "merveilleux",   stim_key_association: good_side},
  {category: "good-bad", stimulus: "joie",          stim_key_association: good_side},
  {category: "good-bad", stimulus: "heureux",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "paix",          stim_key_association: good_side},
  {category: "good-bad", stimulus: "liberté",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "vacances",      stim_key_association: good_side},
  {category: "good-bad", stimulus: "blessure",      stim_key_association: bad_side},
  {category: "good-bad", stimulus: "épouvantable",  stim_key_association: bad_side},
  {category: "good-bad", stimulus: "horrible",      stim_key_association: bad_side},
  {category: "good-bad", stimulus: "mal",           stim_key_association: bad_side},
  {category: "good-bad", stimulus: "affreux",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "échec",         stim_key_association: bad_side},
  {category: "good-bad", stimulus: "méchant",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "douleur",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "prison",        stim_key_association: bad_side},
  {category: "good-bad", stimulus: "malade",        stim_key_association: bad_side},
  {category: "black-white", stimulus: "Mustafa",    stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Aziz",       stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Ali",        stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Farid",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Zahir",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Youssef",    stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Kader",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Hassan",     stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Ahmed",      stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Mohammed",   stim_key_association: black_side_1st},
  {category: "black-white", stimulus: "Benoît",     stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Thibault",   stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Blaise",     stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Bastien",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Gautier",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Rémy",       stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Matthieu",   stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Fabrice",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Sylvain",    stim_key_association: white_side_1st},
  {category: "black-white", stimulus: "Clément",    stim_key_association: white_side_1st}
]

var iat_block_4_stim = [
  {category: "black-white", stimulus: "Mustafa",    stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Aziz",       stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Ali",        stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Farid",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Zahir",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Youssef",    stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Kader",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Hassan",     stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Ahmed",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Mohammed",   stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Benoît",     stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Thibault",   stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Blaise",     stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Bastien",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Gautier",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Rémy",       stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Matthieu",   stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Fabrice",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Sylvain",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Clément",    stim_key_association: white_side_2nd}
]

var iat_block_5_stim = [
  {category: "good-bad", stimulus: "amour",         stim_key_association: good_side},
  {category: "good-bad", stimulus: "magnifique",    stim_key_association: good_side},
  {category: "good-bad", stimulus: "plaisir",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "rires",         stim_key_association: good_side},
  {category: "good-bad", stimulus: "merveilleux",   stim_key_association: good_side},
  {category: "good-bad", stimulus: "joie",          stim_key_association: good_side},
  {category: "good-bad", stimulus: "heureux",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "paix",          stim_key_association: good_side},
  {category: "good-bad", stimulus: "liberté",       stim_key_association: good_side},
  {category: "good-bad", stimulus: "vacances",      stim_key_association: good_side},
  {category: "good-bad", stimulus: "blessure",      stim_key_association: bad_side},
  {category: "good-bad", stimulus: "épouvantable",  stim_key_association: bad_side},
  {category: "good-bad", stimulus: "horrible",      stim_key_association: bad_side},
  {category: "good-bad", stimulus: "mal",           stim_key_association: bad_side},
  {category: "good-bad", stimulus: "affreux",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "échec",         stim_key_association: bad_side},
  {category: "good-bad", stimulus: "méchant",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "douleur",       stim_key_association: bad_side},
  {category: "good-bad", stimulus: "prison",        stim_key_association: bad_side},
  {category: "good-bad", stimulus: "malade",        stim_key_association: bad_side},
  {category: "black-white", stimulus: "Mustafa",    stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Aziz",       stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Ali",        stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Farid",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Zahir",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Youssef",    stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Kader",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Hassan",     stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Ahmed",      stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Mohammed",   stim_key_association: black_side_2nd},
  {category: "black-white", stimulus: "Benoît",     stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Thibault",   stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Blaise",     stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Bastien",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Gautier",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Rémy",       stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Matthieu",   stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Fabrice",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Sylvain",    stim_key_association: white_side_2nd},
  {category: "black-white", stimulus: "Clément",    stim_key_association: white_side_2nd}
]


// iat - block 1 ------------------------------------------------------------------------orginally 20 trials over 4 stim
var iat_block_1 = {
  timeline: [
    {
      type: 'iat-html',
      stimulus: jsPsych.timelineVariable('stimulus'),
      category: jsPsych.timelineVariable('category'),
      label_category: ['black-white'],
      stim_key_association: jsPsych.timelineVariable('stim_key_association'),
      html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
      force_correct_key_press: true,
      display_feedback: true,
      left_category_label:  [block_1_left_label],
      right_category_label: [block_1_right_label],
      response_ends_trial: true,
      data: {
        iat_block: 1,
        iat_type: 'practice',
        iat_label_left:  block_1_left_label,
        iat_label_right: block_1_right_label
      }
    },
    save_iat_trial
  ],
  timeline_variables: sample_n_iat(iat_block_1_stim)  //here, put 30
}

// iat - block 2 ------------------------------------------------------------------------orginally 20 trials over 4 stim
var iat_block_2 = {
  timeline: [
    {
      type: 'iat-html',
      stimulus: jsPsych.timelineVariable('stimulus'),
      category: jsPsych.timelineVariable('category'),
      label_category: ['good-bad'],
      stim_key_association: jsPsych.timelineVariable('stim_key_association'),
      html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
      force_correct_key_press: true,
      display_feedback: true,
      left_category_label:  [block_2_left_label],
      right_category_label: [block_2_right_label],
      response_ends_trial: true,
      data: {
        iat_block: 2,
        iat_type: 'practice',
        iat_label_left:  block_2_left_label,
        iat_label_right: block_2_right_label
         }
    },
    save_iat_trial
  ],
  timeline_variables: sample_n_iat(iat_block_2_stim) //here, put 30
}


// iat - block 3 (test) -----------------------------------------------------------------orginally 74 trials over 8 stim
var iat_block_3_test = {
  timeline: [
    {
      type: 'iat-html',
      stimulus: jsPsych.timelineVariable('stimulus'),
      category: jsPsych.timelineVariable('category'),
      label_category: ['good-bad', 'black-white'],
      stim_key_association: jsPsych.timelineVariable('stim_key_association'),
      html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
      force_correct_key_press: true,
      display_feedback: true,
      left_category_label:  [block_3_left_label_top, block_3_left_label_bottom],
      right_category_label: [block_3_right_label_top, block_3_right_label_bottom],
      response_ends_trial: true,
      data: {
        iat_type: 'test',
        iat_block: 3,
        iat_label_left:  block_3_left_label_top  + "-" + block_3_left_label_bottom,
        iat_label_right: block_3_right_label_top + "-" + block_3_right_label_bottom
         }
    },
    save_iat_trial
  ],
  timeline_variables: shuffleIATstims(iat_block_3_stim)
  //timeline_variables: sample_n_iat(iat_block_3_stim, 5)  //here, put 60
}

// iat - block 4 ------------------------------------------------------------------------orginally 20 trials over 4 stim
var iat_block_4 = {
  timeline: [
    {
      type: 'iat-html',
      stimulus: jsPsych.timelineVariable('stimulus'),
      category: jsPsych.timelineVariable('category'),
      stim_key_association: jsPsych.timelineVariable('stim_key_association'),
      label_category: ['black-white'],
      html_when_wrong: '<span style="color: red; font-size: 80px">&times;</span>',
      force_correct_key_press: true,
      display_feedback: true,
      left_category_label:  [block_4_left_label],
      right_category_label: [block_4_right_label],
      response_ends_trial: true,
      data: {
        iat_block: 4,
        iat_type: 'practice',
        iat_label_left:  block_4_left_label,
        iat_label_right: block_4_right_label
         }
    },
    save_iat_trial
  ],
  timeline_variables: sample_n_iat(iat_block_4_stim)  //here, put 60
}

// iat - block 5 (test) -----------------------------------------------------------------orginally 74 trials over 8 stim
var iat_block_5_test = {
  timeline: [
    {
      type: 'iat-html',
      stimulus: jsPsych.timelineVariable('stimulus'),
      category: jsPsych.timelineVariable('category'),
      label_category: ['good-bad', 'black-white'],
      stim_key_association: jsPsych.timelineVariable('stim_key_association'),
      html_when_wrong: '<span style="color: red; font-size: 80px">X</span>',
      bottom_instructions: '<p>Si vous appuyez sur la mauvaise touche, un X rouge apparaîtra. Appuyez sur la touche inverse pour continuer</p>',
      force_correct_key_press: true,
      display_feedback: true,
      left_category_label:  [block_5_left_label_top, block_5_left_label_bottom],
      right_category_label: [block_5_right_label_top, block_5_right_label_bottom],
      response_ends_trial: true,
      data: {
        iat_block: 5,
        iat_type: 'test',
        iat_label_left:  block_5_left_label_top  + "-" + block_5_left_label_bottom,
        iat_label_right: block_5_right_label_top + "-" + block_5_right_label_bottom
         }
    },
    save_iat_trial
  ],
  timeline_variables: shuffleIATstims(iat_block_5_stim)
  //timeline_variables: sample_n_iat(iat_block_5_stim, 5)  //here, put 60
}


  var extra_information = {
    type: 'html-keyboard-response',
    stimulus:
      "<p class='instructions'>L'étude est presque terminée. Nous allons vous poser quelques questions.</p>" +
      "<p class='continue-instructions'>Appuyez sur <strong>espace</strong> pour continuer.</p>",
    choices: [32]
  };

 var extra_information_Mg = {
    timeline: [{
      type: 'survey-text',
      questions: [{prompt: "Quel est votre sentiment général à l’égard des personnes <b>d'origine maghrébine</b> ? <br>Veuillez noter un chiffre entre 0 (sentiment très négatif) et 100 (sentiment très positif)."}],
      button_label: "confirmer",
    }],
    loop_function: function(data) {
      var extra_information_Mg = data.values()[0].responses;
      var extra_information_Mg = JSON.parse(extra_information_Mg).Q0;
      if (extra_information_Mg == "") {
        alert("Veuillez indiquer un chiffre !");
        return true;
      }
    },
    on_finish: function(data) {
      jsPsych.data.addProperties({
        extra_information_Mg: JSON.parse(data.responses)["Q0"],
      });
    }
  }

 var extra_information_Fr = {
    timeline: [{
      type: 'survey-text',
      questions: [{prompt: "Quel est votre sentiment général à l’égard des personnes <b>d'origine belge</b> ? <br>Veuillez noter un chiffre entre 0 (sentiment très négatif) et 100 (sentiment très positif)."}],
      button_label: "confirmer",
    }],
    loop_function: function(data) {
      var extra_information_Fr = data.values()[0].responses;
      var extra_information_Fr = JSON.parse(extra_information_Fr).Q0;
      if (extra_information_Fr == "") {
        alert("Veuillez indiquer un chiffre !");
        return true;
      }
    },
    on_finish: function(data) {
      jsPsych.data.addProperties({
        extra_information_Fr: JSON.parse(data.responses)["Q0"],
      });
    }
  }

   var extra_information_1 = {
    timeline: [{
      type: 'survey-text',
      questions: [{prompt: "Quel est votre âge ?"}],
      button_label: "confirmer",
    }],
    loop_function: function(data) {
      var extra_information_2 = data.values()[0].responses;
      var extra_information_2 = JSON.parse(extra_information_2).Q0;
      if (extra_information_2 == "") {
        alert("Veuillez entrer votre âge !");
        return true;
      }
    },
    on_finish: function(data) {
      jsPsych.data.addProperties({
        extra_information_2: JSON.parse(data.responses)["Q0"],
      });
    }
  }
  
  var extra_information_2 = {
    type: 'survey-multi-choice',
    questions: [{prompt: "Quel est votre genre ?", options: ["&nbspHomme", "&nbspFemme", "&nbspAutre"], required: true, horizontal: true}],
    button_label: "confirmer"
  }

  var extra_information_3 = {
    type: 'survey-multi-choice',
    questions: [{prompt: "A quel point parlez-vous bien le français ?",
                 options: ["&nbspLangue maternelle", "&nbspTrès bien", "&nbspBien", "&nbspMoyennement", "&nbspMal", "&nbspTrès mal"],
                 required: true, horizontal: false}],
    button_label: "confirmer"
  }
  
  var extra_information_4 = {
    type: 'survey-multi-choice',
    questions: [{prompt: "De quelle origine vous estimez-vous ?",
                 options: ["&nbspBelge", "&nbspMaghrébine", "&nbspAutre"],
                 required: true, horizontal: false}],
    button_label: "confirmer"
  }


  var extra_information_5 = {
    type: 'survey-text',
    questions: [{prompt: "Avez-vous des remarques concernant cette étude ? [Optionnel]"}],
    button_label: "confirmer"
  }

  var ending = {
    type: "html-keyboard-response",
    stimulus:
      "<p class='instructions'>L'étude est terminée.<p>" +
      "<p class='instructions'>Dans cette étude, nous nous intéressions à l'effet d'un entrainement d'approche/évitement sur la perception de visages. " +
      "Plus spécifiquement, nous nous attendons à ce que vous préfériez le groupe que vous avez approché dans la tâche du Jeu Vidéo en comparaison au groupe que vous avez évité. " +
      "Cette préférence était mesurée dans les tâches 2 et 3 que vous avez passé après la tâche du Jeu Vidéo. </p>" +
      "<p class='instructions'> Notez que vous recevrez plus d'informations via le moodle en temps voulu. </p>" +
      "<p class='instructions'>Pour plus d'informations, n'hésitez pas à m'envoyer un mail : " +
      "marine.rougier@uclouvain.be</p>" +
      "<p class = 'continue-instructions'>Appuyez sur <strong>espace</strong> pour valider votre participation.</p>",
    choices: [32]
  };

// end fullscreen -----------------------------------------------------------------------

var fullscreen_trial_exit = {
  type: 'fullscreen',
  fullscreen_mode: false
}


// procedure ----------------------------------------------------------------------------
// Initialize timeline ------------------------------------------------------------------

var timeline = [];

// fullscreen
timeline.push(
        fullscreen_trial,
			  hiding_cursor);

timeline.push(save_id);

    timeline.push(iat_instructions_1,
                  iat_instructions_1_1,
                  iat_instructions_block_1, 
                  iat_block_1,
                  iat_instructions_block_2, 
                  iat_block_2,
                  iat_instructions_block_3, 
                  iat_block_3_test,
                  iat_instructions_block_4, 
                  iat_block_4,
                  iat_instructions_block_5, 
                  iat_block_5_test
                  );
// vaast - end
  timeline.push(fullscreen_trial_exit,
                showing_cursor);

 // demographic questions
  timeline.push(extra_information,
                extra_information_Mg,
                extra_information_Fr,
                extra_information_1,
                extra_information_2,
                extra_information_3,
                extra_information_4,
                extra_information_5,
                save_extra);

  // ending
  timeline.push(ending);

// Launch experiment --------------------------------------------------------------------
// preloading ---------------------------------------------------------------------------
// Preloading. For some reason, it appears auto-preloading fails, so using it manually.
// In principle, it should have ended when participants starts VAAST procedure (which)
// contains most of the image that have to be pre-loaded.
var loading_gif               = ["media/loading.gif"]
jsPsych.pluginAPI.preloadImages(loading_gif);

// timeline initiaization ---------------------------------------------------------------

if(is_compatible) {
  jsPsych.init({
      timeline: timeline,
      on_interaction_data_update: function() {
        saving_browser_events(completion = false);
      },
    on_finish: function() {
        saving_browser_events(completion = true);
        jsPsych.data.addProperties({
        vaast_condition_approach: vaast_condition_approach,
        });
        window.location.href = "https://google.com";
    }
  });
}


