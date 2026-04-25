function q(id, subdomain, weight, reverse, stemKey, text) {
  return {
    id,
    domain: "ADHD",
    subdomain,
    weight,
    reverse,
    stemKey,
    text
  };
}

function pad(num) {
  return String(num).padStart(3, "0");
}

const CONTEXTS = [
  {
    hu: "otthon a napi rutin során",
    en: "at home during daily routines"
  },
  {
    hu: "iskolai feladatok közben",
    en: "during school tasks"
  },
  {
    hu: "társas helyzetekben",
    en: "in social situations"
  },
  {
    hu: "strukturált feladatvégzés során",
    en: "during structured activities"
  },
  {
    hu: "amikor egyszerre több inger éri",
    en: "when several stimuli are present at once"
  },
  {
    hu: "stresszes helyzetekben",
    en: "in stressful situations"
  },
  {
    hu: "amikor várnia kell",
    en: "when waiting is required"
  },
  {
    hu: "önálló feladatmegoldás közben",
    en: "during independent task completion"
  },
  {
    hu: "ha szabályokat kell követnie",
    en: "when rules need to be followed"
  },
  {
    hu: "felnőtti irányítás nélkül",
    en: "without direct adult guidance"
  }
];

const STEMS = {
  inattention: [
    {
      stemKey: "focus_duration",
      weight: 2.0,
      reverse: false,
      text: {
        hu: "Gyakran nehéz számára tartósan egy dologra figyelni, még akkor is, ha az fontos lenne",
        en: "Often struggles to stay focused on one thing for a longer period, even when it matters"
      }
    },
    {
      stemKey: "external_distraction",
      weight: 1.9,
      reverse: false,
      text: {
        hu: "Könnyen elvonja a figyelmét bármi, ami körülötte történik",
        en: "Is easily distracted by what is happening around them"
      }
    },
    {
      stemKey: "unfinished_tasks",
      weight: 1.8,
      reverse: false,
      text: {
        hu: "Gyakran félbehagy feladatokat, mielőtt befejezné őket",
        en: "Often leaves tasks unfinished before completing them"
      }
    },
    {
      stemKey: "careless_errors",
      weight: 1.7,
      reverse: false,
      text: {
        hu: "Hajlamos figyelmetlenségi hibákat véteni még egyszerűbb helyzetekben is",
        en: "Tends to make careless mistakes even in simpler situations"
      }
    },
    {
      stemKey: "sustained_focus_reverse",
      weight: 1.8,
      reverse: true,
      text: {
        hu: "Képes huzamosabb ideig egy feladatra koncentrálni, ha szükséges",
        en: "Can stay focused on a task for an extended time when needed"
      }
    }
  ],

  hyperactivity: [
    {
      stemKey: "sit_still",
      weight: 2.0,
      reverse: false,
      text: {
        hu: "Gyakran nehéz számára nyugodtan ülni vagy egy helyben maradni",
        en: "Often finds it difficult to sit still or stay in one place"
      }
    },
    {
      stemKey: "driven_motor",
      weight: 1.9,
      reverse: false,
      text: {
        hu: "Folyamatos mozgásigénye van, mintha mindig 'menne benne a motor'",
        en: "Seems to have a constant need to move, as if driven by a motor"
      }
    },
    {
      stemKey: "visible_restlessness",
      weight: 1.8,
      reverse: false,
      text: {
        hu: "Testi nyugtalansága gyakran látható mások számára is",
        en: "Physical restlessness is often noticeable to others"
      }
    },
    {
      stemKey: "calm_expectation",
      weight: 1.7,
      reverse: false,
      text: {
        hu: "Nehezen alkalmazkodik olyan helyzetekhez, ahol nyugalom lenne elvárt",
        en: "Struggles to adapt to situations where calm behavior is expected"
      }
    },
    {
      stemKey: "physical_calm_reverse",
      weight: 1.8,
      reverse: true,
      text: {
        hu: "Képes testi nyugalmat fenntartani, ha a helyzet ezt megkívánja",
        en: "Can maintain physical calm when the situation requires it"
      }
    }
  ],

  impulsivity: [
    {
      stemKey: "interrupting",
      weight: 2.0,
      reverse: false,
      text: {
        hu: "Gyakran megszakít másokat vagy közbevág beszélgetésekbe",
        en: "Often interrupts others or cuts into conversations"
      }
    },
    {
      stemKey: "reacts_fast",
      weight: 1.9,
      reverse: false,
      text: {
        hu: "Sokszor hamarabb reagál, mint ahogy végiggondolná a helyzetet",
        en: "Often reacts before fully thinking things through"
      }
    },
    {
      stemKey: "wait_turn",
      weight: 1.8,
      reverse: false,
      text: {
        hu: "Nehezen várja ki a sorát vagy a megfelelő pillanatot",
        en: "Finds it difficult to wait for their turn or the right moment"
      }
    },
    {
      stemKey: "quick_decisions",
      weight: 1.7,
      reverse: false,
      text: {
        hu: "Hirtelen döntéseket hoz anélkül, hogy mérlegelné a következményeket",
        en: "Makes quick decisions without considering consequences"
      }
    },
    {
      stemKey: "pause_before_acting_reverse",
      weight: 1.8,
      reverse: true,
      text: {
        hu: "Képes megállni és átgondolni, mielőtt cselekszik",
        en: "Can pause and think before acting"
      }
    }
  ],

  executive: [
    {
      stemKey: "task_organization",
      weight: 2.0,
      reverse: false,
      text: {
        hu: "Nehézséget okoz számára a feladatok átlátása és megszervezése",
        en: "Has difficulty understanding and organizing tasks"
      }
    },
    {
      stemKey: "loses_items",
      weight: 1.9,
      reverse: false,
      text: {
        hu: "Gyakran elveszíti vagy nem találja meg a szükséges dolgokat",
        en: "Often loses or cannot find necessary items"
      }
    },
    {
      stemKey: "task_initiation",
      weight: 1.8,
      reverse: false,
      text: {
        hu: "Halogatja a feladatok elkezdését, még akkor is, ha tudja, mit kellene tennie",
        en: "Delays starting tasks even when knowing what should be done"
      }
    },
    {
      stemKey: "working_memory",
      weight: 1.7,
      reverse: false,
      text: {
        hu: "Nehéz számára fejben tartani több lépést vagy instrukciót egyszerre",
        en: "Struggles to hold multiple steps or instructions in mind"
      }
    },
    {
      stemKey: "independent_completion_reverse",
      weight: 1.8,
      reverse: true,
      text: {
        hu: "Képes önállóan megszervezni és végigvinni egy feladatot",
        en: "Can independently organize and complete a task"
      }
    }
  ],

  emotional: [
    {
      stemKey: "quick_intense_emotions",
      weight: 2.0,
      reverse: false,
      text: {
        hu: "Érzelmi reakciói gyakran gyorsak és intenzívek",
        en: "Emotional reactions are often quick and intense"
      }
    },
    {
      stemKey: "frustration_tolerance",
      weight: 1.9,
      reverse: false,
      text: {
        hu: "Nehezen viseli a frusztrációt vagy a kisebb kudarcokat",
        en: "Has difficulty coping with frustration or minor setbacks"
      }
    },
    {
      stemKey: "mood_shift",
      weight: 1.8,
      reverse: false,
      text: {
        hu: "Hangulata könnyen és gyorsan változik",
        en: "Mood can shift quickly and easily"
      }
    },
    {
      stemKey: "calming_down",
      weight: 1.7,
      reverse: false,
      text: {
        hu: "Nehezen nyugszik meg egy felzaklató helyzet után",
        en: "Finds it difficult to calm down after being upset"
      }
    },
    {
      stemKey: "emotion_regulation_reverse",
      weight: 1.8,
      reverse: true,
      text: {
        hu: "Képes kezelni az érzelmeit még nehezebb helyzetekben is",
        en: "Can manage emotions even in challenging situations"
      }
    }
  ]
};

function withContext(stem, context) {
  return {
    hu: `${stem.hu} ${context.hu}.`,
    en: `${stem.en} ${context.en}.`
  };
}

const ORDER = ["inattention", "hyperactivity", "impulsivity", "executive", "emotional"];

const ADHD_BANK = [];
let num = 1;

for (const subdomain of ORDER) {
  for (const stem of STEMS[subdomain]) {
    for (const context of CONTEXTS) {
      ADHD_BANK.push(
        q(
  `ADHD_${pad(num++)}`,
  subdomain,
  stem.weight,
  stem.reverse,
  stem.stemKey,
  withContext(stem.text, context)
)
        )
    }
  }
}

export { ADHD_BANK };