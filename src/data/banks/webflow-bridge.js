import { TRIAGE_BANK } from "./triage.bank.js";
import { ADHD_BANK } from "./adhd.bank.js";
import { ASD_BANK } from "./asd.bank.js";
import { ANXIETY_BANK } from "./anxiety.bank.js";
import { DEPRESSION_BANK } from "./depression.bank.js";
import { LEARNING_BANK } from "./learning.bank.js";

const EXTRA_BANKS = {
  ADHD: [
    {
      id: "adhd_extra_1",
      domain: "ADHD",
      subdomain: "attention_regulation",
      stemKey: "cross_context_attention",
      weight: 1.1,
      text: {
        hu: "A figyelmi nehézségek többféle helyzetben is hasonlóan megjelennek.",
        en: "Attention difficulties appear similarly across different situations."
      }
    },
    {
      id: "adhd_extra_2",
      domain: "ADHD",
      subdomain: "impulse_control",
      stemKey: "cross_context_impulsivity",
      weight: 1.1,
      text: {
        hu: "Az impulzív reakciók nem csak egyetlen helyzetben vagy környezetben jelentkeznek.",
        en: "Impulsive reactions appear across more than one setting or context."
      }
    },
    {
      id: "adhd_extra_3",
      domain: "ADHD",
      subdomain: "task_completion",
      stemKey: "unfinished_pattern",
      weight: 1,
      text: {
        hu: "A befejezetlenül maradó feladatok többféle tevékenységnél is visszatérő mintát mutatnak.",
        en: "Leaving tasks unfinished appears as a recurring pattern across different activities."
      }
    },
    {
      id: "adhd_extra_4",
      domain: "ADHD",
      subdomain: "attention_regulation",
      stemKey: "distraction_vs_difficulty",
      weight: 1,
      text: {
        hu: "A teljesítményromlás inkább figyelemelterelődésből ered, mint a feladat megértésének hiányából.",
        en: "Performance difficulties seem to come more from distractibility than from not understanding the task."
      }
    },
    {
      id: "adhd_extra_5",
      domain: "ADHD",
      subdomain: "impulse_control",
      stemKey: "timing_self_control",
      weight: 1,
      text: {
        hu: "Gyakran a megfelelő időzítés vagy önkontroll hiánya okozza a nehézséget.",
        en: "The difficulty often comes from poor timing or limited self-control."
      }
    }
  ],

  ASD: [
    {
      id: "asd_extra_1",
      domain: "ASD",
      subdomain: "social_communication",
      stemKey: "social_pattern_consistency",
      weight: 1.1,
      text: {
        hu: "A társas-kommunikációs nehézségek többféle kapcsolatban is következetesen megjelennek.",
        en: "Social-communication difficulties appear consistently across different relationships."
      }
    },
    {
      id: "asd_extra_2",
      domain: "ASD",
      subdomain: "restricted_patterns",
      stemKey: "routine_need_consistency",
      weight: 1.1,
      text: {
        hu: "A megszokott rutinokhoz való ragaszkodás több helyzetben is erősen jelen van.",
        en: "Reliance on familiar routines is strongly present across different situations."
      }
    },
    {
      id: "asd_extra_3",
      domain: "ASD",
      subdomain: "social_reciprocity",
      stemKey: "sharing_difference",
      weight: 1,
      text: {
        hu: "A közös öröm, érdeklődés vagy élmény megosztása a vártnál nehezebben megy.",
        en: "Sharing joy, interest, or experiences is more difficult than expected."
      }
    },
    {
      id: "asd_extra_4",
      domain: "ASD",
      subdomain: "social_communication",
      stemKey: "nonverbal_mismatch",
      weight: 1,
      text: {
        hu: "A nehézség inkább a társas jelek megértésében vagy használatában látszik, mint puszta félénkségben.",
        en: "The difficulty appears more in understanding or using social cues than in simple shyness."
      }
    },
    {
      id: "asd_extra_5",
      domain: "ASD",
      subdomain: "restricted_patterns",
      stemKey: "interest_rigidity",
      weight: 1,
      text: {
        hu: "Az érdeklődési vagy viselkedési minták rugalmatlanabbak a vártnál.",
        en: "Interest or behavior patterns are more rigid than expected."
      }
    }
  ],

  ANXIETY: [
    {
      id: "anxiety_extra_1",
      domain: "ANXIETY",
      subdomain: "general_worry",
      stemKey: "worry_consistency",
      weight: 1.1,
      text: {
        hu: "Az aggodalmaskodás többféle hétköznapi helyzetben is visszatérően megjelenik.",
        en: "Worry appears repeatedly across different everyday situations."
      }
    },
    {
      id: "anxiety_extra_2",
      domain: "ANXIETY",
      subdomain: "avoidance",
      stemKey: "avoidance_pattern",
      weight: 1.1,
      text: {
        hu: "A feszültség inkább elkerüléshez vagy visszahúzódáshoz vezet, mint impulzív reagáláshoz.",
        en: "Tension leads more to avoidance or withdrawal than to impulsive reacting."
      }
    },
    {
      id: "anxiety_extra_3",
      domain: "ANXIETY",
      subdomain: "physical_arousal",
      stemKey: "body_signal_under_stress",
      weight: 1,
      text: {
        hu: "Stressz alatt testi jelek is megjelennek, nem csak belső aggodalom.",
        en: "Under stress, physical signs appear, not just internal worry."
      }
    },
    {
      id: "anxiety_extra_4",
      domain: "ANXIETY",
      subdomain: "uncertainty_stress",
      stemKey: "novelty_uncertainty_tension",
      weight: 1,
      text: {
        hu: "Az ismeretlen vagy bizonytalan helyzetek különösen megterhelőek számára.",
        en: "Unfamiliar or uncertain situations are especially stressful."
      }
    },
    {
      id: "anxiety_extra_5",
      domain: "ANXIETY",
      subdomain: "reassurance_control",
      stemKey: "reassurance_need",
      weight: 1,
      text: {
        hu: "Megnyugtatás nélkül nehezebben csillapodik a feszültsége.",
        en: "Without reassurance, tension is harder to reduce."
      }
    }
  ],

  DEPRESSION: [
    {
      id: "depression_extra_1",
      domain: "DEPRESSION",
      subdomain: "low_mood",
      stemKey: "mood_consistency",
      weight: 1.1,
      text: {
        hu: "A lehangoltság vagy kedvetlenség többféle helyzetben is tartósan jelen van.",
        en: "Low mood or loss of enjoyment is present persistently across different situations."
      }
    },
    {
      id: "depression_extra_2",
      domain: "DEPRESSION",
      subdomain: "interest_loss",
      stemKey: "loss_of_interest_pattern",
      weight: 1.1,
      text: {
        hu: "A korábban kedvelt dolgok iránti érdeklődés csökkenése több területen is látható.",
        en: "Reduced interest in previously enjoyed things is visible across multiple areas."
      }
    },
    {
      id: "depression_extra_3",
      domain: "DEPRESSION",
      subdomain: "self_worth",
      stemKey: "negative_self_view",
      weight: 1,
      text: {
        hu: "A negatív önmagáról alkotott kép nem csak átmeneti rossz hangulathoz kapcsolódik.",
        en: "A negative self-view seems to be more than a brief bad mood."
      }
    },
    {
      id: "depression_extra_4",
      domain: "DEPRESSION",
      subdomain: "energy_motivation",
      stemKey: "low_drive_pattern",
      weight: 1,
      text: {
        hu: "A csökkent energia vagy motiváció többféle tevékenységben is megjelenik.",
        en: "Lower energy or motivation appears across different activities."
      }
    },
    {
      id: "depression_extra_5",
      domain: "DEPRESSION",
      subdomain: "emotional_regulation",
      stemKey: "sad_irritable_mix",
      weight: 1,
      text: {
        hu: "A hangulati nehézség inkább lehangoltságban vagy ingerlékenységben látszik, mint puszta fáradtságban.",
        en: "The mood difficulty appears more as sadness or irritability than as simple tiredness."
      }
    }
  ],

  LEARNING: [
    {
      id: "learning_extra_1",
      domain: "LEARNING",
      subdomain: "academic_performance",
      stemKey: "task_specific_learning_pattern",
      weight: 1.1,
      text: {
        hu: "A nehézség főként tanulási feladatokban jelenik meg, nem minden működési területen.",
        en: "The difficulty appears mainly in learning tasks, not across every area of functioning."
      }
    },
    {
      id: "learning_extra_2",
      domain: "LEARNING",
      subdomain: "instruction_understanding",
      stemKey: "instruction_barrier",
      weight: 1.1,
      text: {
        hu: "A gyengébb teljesítmény mögött gyakran a feladat megértésének nehézsége áll.",
        en: "Difficulty understanding the task often seems to underlie the weaker performance."
      }
    },
    {
      id: "learning_extra_3",
      domain: "LEARNING",
      subdomain: "reading",
      stemKey: "reading_specificity",
      weight: 1,
      text: {
        hu: "A probléma különösen az olvasási jellegű feladatokban tűnik erősebbnek.",
        en: "The problem seems especially strong in reading-related tasks."
      }
    },
    {
      id: "learning_extra_4",
      domain: "LEARNING",
      subdomain: "writing",
      stemKey: "writing_output_pattern",
      weight: 1,
      text: {
        hu: "Az írásos teljesítmény jobban érintett lehet, mint a szóbeli megértés.",
        en: "Written performance may be more affected than verbal understanding."
      }
    },
    {
      id: "learning_extra_5",
      domain: "LEARNING",
      subdomain: "math",
      stemKey: "math_specific_pattern",
      weight: 1,
      text: {
        hu: "A nehézség bizonyos tanulási területeken kifejezettebb, mint másokban.",
        en: "The difficulty is more pronounced in some learning areas than in others."
      }
    }
  ]
};

const SPECIFIC_BANKS = {
  ADHD: ADHD_BANK,
  ASD: ASD_BANK,
  ANXIETY: ANXIETY_BANK,
  DEPRESSION: DEPRESSION_BANK,
  LEARNING: LEARNING_BANK
};



if (typeof window !== "undefined") {
  window.NM_TRIAGE_BANK = TRIAGE_BANK;
  window.NM_SPECIFIC_BANK = SPECIFIC_BANKS;
  window.NM_EXTRA_BANK = EXTRA_BANKS;
}

export {
  TRIAGE_BANK,
  SPECIFIC_BANKS,
  EXTRA_BANKS
};