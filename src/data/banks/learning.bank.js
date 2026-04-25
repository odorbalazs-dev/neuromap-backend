export const LEARNING_BANK = [
  /* =========================
     CORE 1-120
  ========================= */

  {
    id: "LRN_001",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.4,
    reverse: false,
    stemKey: "sustained_attention",
    text: {
      hu: "Nehezen tud hosszabb ideig egy feladatra figyelni.",
      en: "Has difficulty sustaining attention on one task for longer periods."
    }
  },
  {
    id: "LRN_002",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.3,
    reverse: false,
    stemKey: "distractibility_external",
    text: {
      hu: "Külső ingerek könnyen elvonják a figyelmét.",
      en: "External stimuli easily distract attention."
    }
  },
  {
    id: "LRN_003",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.2,
    reverse: true,
    stemKey: "focus_stability_reverse",
    text: {
      hu: "Általában stabilan fenn tudja tartani a figyelmét.",
      en: "Can generally maintain stable attention."
    }
  },
  {
    id: "LRN_004",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.4,
    reverse: false,
    stemKey: "attention_drift_midtask",
    text: {
      hu: "Feladat közben könnyen elkalandozik a figyelme.",
      en: "Attention easily drifts during tasks."
    }
  },
  {
    id: "LRN_005",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.3,
    reverse: false,
    stemKey: "internal_distraction",
    text: {
      hu: "Saját gondolatai is könnyen elterelik tanulás közben.",
      en: "Internal thoughts easily distract during learning."
    }
  },
  {
    id: "LRN_006",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.4,
    reverse: false,
    stemKey: "task_reentry",
    text: {
      hu: "Megszakítás után nehezen talál vissza a feladathoz.",
      en: "Has difficulty returning to a task after interruption."
    }
  },
  {
    id: "LRN_007",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.3,
    reverse: false,
    stemKey: "low_task_anchoring",
    text: {
      hu: "Nehéz számára mentálisan benne maradni a feladatban.",
      en: "Finds it hard to stay mentally anchored in a task."
    }
  },
  {
    id: "LRN_008",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.2,
    reverse: true,
    stemKey: "attention_reset_reverse",
    text: {
      hu: "Zavaró helyzet után is viszonylag gyorsan vissza tud fókuszálni.",
      en: "Can refocus relatively quickly after distraction."
    }
  },
  {
    id: "LRN_009",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.3,
    reverse: false,
    stemKey: "attention_fluctuation",
    text: {
      hu: "Figyelme ingadozó lehet még akkor is, ha szeretne koncentrálni.",
      en: "Attention may fluctuate even when trying to concentrate."
    }
  },
  {
    id: "LRN_010",
    domain: "LEARNING",
    subdomain: "attention_focus",
    weight: 1.4,
    reverse: false,
    stemKey: "passive_attention_loss",
    text: {
      hu: "Hosszabb magyarázatok közben könnyen elveszíti a fonalat.",
      en: "Easily loses the thread during longer explanations."
    }
  },

  {
    id: "LRN_011",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.4,
    reverse: false,
    stemKey: "holding_information",
    text: {
      hu: "Nehézséget okoz számára több információ fejben tartása.",
      en: "Has difficulty holding multiple pieces of information in mind."
    }
  },
  {
    id: "LRN_012",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.4,
    reverse: false,
    stemKey: "multi_step_instructions",
    text: {
      hu: "Többlépéses instrukciókat nehezebben követ.",
      en: "Has difficulty following multi-step instructions."
    }
  },
  {
    id: "LRN_013",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.3,
    reverse: false,
    stemKey: "mental_tracking",
    text: {
      hu: "Könnyen elveszíti, hogy éppen hol tart egy feladatban.",
      en: "Easily loses track of where they are in a task."
    }
  },
  {
    id: "LRN_014",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.2,
    reverse: true,
    stemKey: "memory_hold_reverse",
    text: {
      hu: "Általában képes több információt is egyszerre fejben tartani.",
      en: "Can usually hold several pieces of information in mind at once."
    }
  },
  {
    id: "LRN_015",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.4,
    reverse: false,
    stemKey: "instruction_loss_midway",
    text: {
      hu: "Előfordul, hogy egy instrukció végét már nem tudja jól összekapcsolni az elejével.",
      en: "May struggle to connect the end of an instruction with its beginning."
    }
  },
  {
    id: "LRN_016",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.3,
    reverse: false,
    stemKey: "temporary_storage_limit",
    text: {
      hu: "Gyorsan túl sok lehet számára, ha egyszerre több dolgot kell fejben tartania.",
      en: "Can become overloaded when holding too many things in mind at once."
    }
  },
  {
    id: "LRN_017",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.3,
    reverse: false,
    stemKey: "verbal_memory_span",
    text: {
      hu: "Szóbeli információt nehezebben tart meg rövid időre.",
      en: "Has more difficulty briefly retaining verbal information."
    }
  },
  {
    id: "LRN_018",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.2,
    reverse: true,
    stemKey: "mental_sequence_reverse",
    text: {
      hu: "Viszonylag jól tud fejben követni sorrendeket és lépéseket.",
      en: "Can relatively well keep track of sequences and steps mentally."
    }
  },
  {
    id: "LRN_019",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.4,
    reverse: false,
    stemKey: "updating_information",
    text: {
      hu: "Nehézséget okozhat számára, hogy fejben frissítse az információkat munka közben.",
      en: "May have difficulty mentally updating information while working."
    }
  },
  {
    id: "LRN_020",
    domain: "LEARNING",
    subdomain: "working_memory",
    weight: 1.3,
    reverse: false,
    stemKey: "remembering_while_doing",
    text: {
      hu: "Nehezebb számára egyszerre gondolkodni és közben észben tartani fontos részleteket.",
      en: "Finds it harder to think and simultaneously keep important details in mind."
    }
  },

  {
    id: "LRN_021",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.4,
    reverse: false,
    stemKey: "slow_processing",
    text: {
      hu: "Több időre van szüksége az információk feldolgozásához.",
      en: "Needs more time to process information."
    }
  },
  {
    id: "LRN_022",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.3,
    reverse: false,
    stemKey: "response_delay",
    text: {
      hu: "Válaszadás előtt hosszabb időre van szüksége.",
      en: "Needs more time before responding."
    }
  },
  {
    id: "LRN_023",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.2,
    reverse: true,
    stemKey: "fast_processing_reverse",
    text: {
      hu: "Gyorsan képes feldolgozni az új információkat.",
      en: "Can process new information quickly."
    }
  },
  {
    id: "LRN_024",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.4,
    reverse: false,
    stemKey: "slow_task_completion",
    text: {
      hu: "A feladatokat a vártnál lassabban fejezheti be.",
      en: "May complete tasks more slowly than expected."
    }
  },
  {
    id: "LRN_025",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.3,
    reverse: false,
    stemKey: "mental_latency",
    text: {
      hu: "Gondolkodása időnként lassabbnak tűnhet.",
      en: "Thinking may seem slower at times."
    }
  },
  {
    id: "LRN_026",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.4,
    reverse: false,
    stemKey: "under_time_pressure_slowing",
    text: {
      hu: "Időnyomás alatt még inkább lelassulhat.",
      en: "May slow down even more under time pressure."
    }
  },
  {
    id: "LRN_027",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.3,
    reverse: false,
    stemKey: "slow_reading_absorption",
    text: {
      hu: "Olvasás közben több idő kell neki, hogy valóban befogadja a tartalmat.",
      en: "Needs more time while reading to truly absorb the content."
    }
  },
  {
    id: "LRN_028",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.2,
    reverse: true,
    stemKey: "pace_keepup_reverse",
    text: {
      hu: "Többnyire képes tartani a munkatempót másokkal.",
      en: "Can usually keep up with others' working pace."
    }
  },
  {
    id: "LRN_029",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.3,
    reverse: false,
    stemKey: "slow_information_conversion",
    text: {
      hu: "A hallott vagy látott információt lassabban alakítja használható tudássá.",
      en: "Converts heard or seen information into usable understanding more slowly."
    }
  },
  {
    id: "LRN_030",
    domain: "LEARNING",
    subdomain: "processing_speed",
    weight: 1.4,
    reverse: false,
    stemKey: "delayed_task_entry",
    text: {
      hu: "Egy új feladatba lassabban tud belehelyezkedni.",
      en: "Takes longer to settle into a new task."
    }
  },

  {
    id: "LRN_031",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.5,
    reverse: false,
    stemKey: "task_initiation",
    text: {
      hu: "Nehezen kezdi el a feladatokat.",
      en: "Has difficulty initiating tasks."
    }
  },
  {
    id: "LRN_032",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.4,
    reverse: false,
    stemKey: "planning_difficulty",
    text: {
      hu: "Nehézséget okoz számára a tervezés.",
      en: "Has difficulty planning tasks."
    }
  },
  {
    id: "LRN_033",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.2,
    reverse: true,
    stemKey: "organization_reverse",
    text: {
      hu: "Általában jól szervezi a feladatait.",
      en: "Generally organizes tasks well."
    }
  },
  {
    id: "LRN_034",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.4,
    reverse: false,
    stemKey: "task_completion",
    text: {
      hu: "Nehezen fejez be elkezdett feladatokat.",
      en: "Has difficulty finishing tasks once started."
    }
  },
  {
    id: "LRN_035",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.3,
    reverse: false,
    stemKey: "prioritization",
    text: {
      hu: "Nehézséget okoz a feladatok sorrendjének meghatározása.",
      en: "Has difficulty deciding the order of tasks."
    }
  },
  {
    id: "LRN_036",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.4,
    reverse: false,
    stemKey: "breaking_down_tasks",
    text: {
      hu: "Nehéz számára egy nagyobb feladatot kisebb lépésekre bontani.",
      en: "Finds it difficult to break a larger task into smaller steps."
    }
  },
  {
    id: "LRN_037",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.3,
    reverse: false,
    stemKey: "task_sequence_management",
    text: {
      hu: "Előfordul, hogy összekeveri a feladatlépések sorrendjét.",
      en: "May mix up the order of task steps."
    }
  },
  {
    id: "LRN_038",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.2,
    reverse: true,
    stemKey: "goal_directed_followthrough_reverse",
    text: {
      hu: "Többnyire végig tud vinni egy tervet a megvalósításig.",
      en: "Can usually carry a plan through to completion."
    }
  },
  {
    id: "LRN_039",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.4,
    reverse: false,
    stemKey: "setup_overwhelm",
    text: {
      hu: "Már a feladat előkészítése is túlterhelő lehet számára.",
      en: "Even setting up for a task may feel overwhelming."
    }
  },
  {
    id: "LRN_040",
    domain: "LEARNING",
    subdomain: "executive_function",
    weight: 1.3,
    reverse: false,
    stemKey: "monitoring_own_progress",
    text: {
      hu: "Nehezebben követi, hogy mennyire haladt egy feladattal.",
      en: "Has more difficulty monitoring progress on a task."
    }
  },

  {
    id: "LRN_041",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.4,
    reverse: false,
    stemKey: "time_estimation",
    text: {
      hu: "Nehezen becsüli meg, mennyi időt vesz igénybe egy feladat.",
      en: "Has difficulty estimating how long a task will take."
    }
  },
  {
    id: "LRN_042",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.4,
    reverse: false,
    stemKey: "deadline_management",
    text: {
      hu: "Nehézséget okoz számára a határidők követése.",
      en: "Has difficulty keeping track of deadlines."
    }
  },
  {
    id: "LRN_043",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.3,
    reverse: false,
    stemKey: "material_organization",
    text: {
      hu: "Tanulási anyagai vagy eszközei könnyen rendezetlenné válnak.",
      en: "Learning materials or tools easily become disorganized."
    }
  },
  {
    id: "LRN_044",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.2,
    reverse: true,
    stemKey: "time_structure_reverse",
    text: {
      hu: "Általában jól tudja strukturálni az idejét.",
      en: "Can generally structure time well."
    }
  },
  {
    id: "LRN_045",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.3,
    reverse: false,
    stemKey: "forgetting_materials",
    text: {
      hu: "Gyakrabban előfordulhat, hogy valamit otthon hagy vagy elfelejt magával vinni.",
      en: "More often leaves something behind or forgets to bring it."
    }
  },
  {
    id: "LRN_046",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.4,
    reverse: false,
    stemKey: "late_starting",
    text: {
      hu: "A szükségesnél később kezd neki feladatoknak.",
      en: "Starts tasks later than needed."
    }
  },
  {
    id: "LRN_047",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.3,
    reverse: false,
    stemKey: "overlooking_steps",
    text: {
      hu: "Könnyen kimaradnak kisebb, de fontos szervezési lépések.",
      en: "Smaller but important organizing steps are easily overlooked."
    }
  },
  {
    id: "LRN_048",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.2,
    reverse: true,
    stemKey: "preparedness_reverse",
    text: {
      hu: "Többnyire előkészülten érkezik feladatokhoz vagy tanulási helyzetekhez.",
      en: "Usually comes prepared to tasks or learning situations."
    }
  },
  {
    id: "LRN_049",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.4,
    reverse: false,
    stemKey: "task_pacing",
    text: {
      hu: "Nehezen osztja be az idejét egy hosszabb feladaton belül.",
      en: "Has difficulty pacing time within a longer task."
    }
  },
  {
    id: "LRN_050",
    domain: "LEARNING",
    subdomain: "organization_time_management",
    weight: 1.3,
    reverse: false,
    stemKey: "schedule_followthrough",
    text: {
      hu: "A megtervezett ütemezést nehezebben tudja tartani.",
      en: "Has more difficulty sticking to a planned schedule."
    }
  },

  {
    id: "LRN_051",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.4,
    reverse: false,
    stemKey: "instruction_comprehension",
    text: {
      hu: "Előfordulhat, hogy elsőre nem teljesen érti meg a feladatot.",
      en: "May not fully understand a task the first time."
    }
  },
  {
    id: "LRN_052",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.3,
    reverse: false,
    stemKey: "complex_sentence_parsing",
    text: {
      hu: "Összetettebb megfogalmazásokat nehezebben bont le jelentésre.",
      en: "Has more difficulty unpacking the meaning of more complex wording."
    }
  },
  {
    id: "LRN_053",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.2,
    reverse: true,
    stemKey: "verbal_understanding_reverse",
    text: {
      hu: "Többnyire jól érti a szóbeli magyarázatokat.",
      en: "Usually understands verbal explanations well."
    }
  },
  {
    id: "LRN_054",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.4,
    reverse: false,
    stemKey: "reading_comprehension_depth",
    text: {
      hu: "Olvasás után nehezebb lehet pontosan visszaadnia a lényeget.",
      en: "After reading, it may be harder to accurately retell the main point."
    }
  },
  {
    id: "LRN_055",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.3,
    reverse: false,
    stemKey: "literal_task_interpretation",
    text: {
      hu: "Időnként túl szó szerint értelmezhet instrukciókat vagy kérdéseket.",
      en: "May sometimes interpret instructions or questions too literally."
    }
  },
  {
    id: "LRN_056",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.4,
    reverse: false,
    stemKey: "linking_concepts",
    text: {
      hu: "Nehezebb számára összekapcsolni az új információt a már meglévő tudásával.",
      en: "Finds it harder to connect new information with existing knowledge."
    }
  },
  {
    id: "LRN_057",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.3,
    reverse: false,
    stemKey: "implicit_meaning_detection",
    text: {
      hu: "A rejtettebb jelentéseket vagy elvárásokat nehezebben veszi észre.",
      en: "Has more difficulty noticing implicit meanings or expectations."
    }
  },
  {
    id: "LRN_058",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.2,
    reverse: true,
    stemKey: "meaning_integration_reverse",
    text: {
      hu: "Általában jól össze tudja rakni az információk jelentését.",
      en: "Can generally integrate the meaning of information well."
    }
  },
  {
    id: "LRN_059",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.3,
    reverse: false,
    stemKey: "question_misreading",
    text: {
      hu: "Előfordulhat, hogy nem pontosan azt válaszolja meg, amit a kérdés kér.",
      en: "May not always answer exactly what the question asks."
    }
  },
  {
    id: "LRN_060",
    domain: "LEARNING",
    subdomain: "comprehension_language",
    weight: 1.4,
    reverse: false,
    stemKey: "dense_text_load",
    text: {
      hu: "Sűrűbb vagy információban gazdag szövegek könnyebben túlterhelik.",
      en: "Denser or information-heavy texts are more easily overwhelming."
    }
  },

  {
    id: "LRN_061",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.4,
    reverse: false,
    stemKey: "strategy_shifting",
    text: {
      hu: "Nehézséget okozhat számára új megoldási módra váltani.",
      en: "May have difficulty shifting to a new way of solving something."
    }
  },
  {
    id: "LRN_062",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.3,
    reverse: false,
    stemKey: "stuck_on_approach",
    text: {
      hu: "Hajlamos lehet ragaszkodni egy már nem működő megoldáshoz.",
      en: "May cling to an approach that is no longer working."
    }
  },
  {
    id: "LRN_063",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.2,
    reverse: true,
    stemKey: "flexible_adjustment_reverse",
    text: {
      hu: "Viszonylag könnyen tud alkalmazkodni, ha változtatni kell a módszeren.",
      en: "Can relatively easily adjust when a method needs to change."
    }
  },
  {
    id: "LRN_064",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.4,
    reverse: false,
    stemKey: "switching_between_rules",
    text: {
      hu: "Nehezebb számára váltani eltérő szabályok vagy szempontok között.",
      en: "Finds it harder to switch between different rules or perspectives."
    }
  },
  {
    id: "LRN_065",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.3,
    reverse: false,
    stemKey: "change_resistance_learning",
    text: {
      hu: "A megszokott tanulási vagy gondolkodási mintát nehezebben engedi el.",
      en: "Has more difficulty letting go of familiar learning or thinking patterns."
    }
  },
  {
    id: "LRN_066",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.4,
    reverse: false,
    stemKey: "error_correction_shift",
    text: {
      hu: "Hibajelzés után sem mindig könnyű új irányba indulnia.",
      en: "Even after feedback, it may not be easy to move in a new direction."
    }
  },
  {
    id: "LRN_067",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.3,
    reverse: false,
    stemKey: "adapting_to_task_demands",
    text: {
      hu: "Nehéz számára észlelni, hogy egy feladat más típusú gondolkodást igényel.",
      en: "Finds it harder to notice when a task requires a different type of thinking."
    }
  },
  {
    id: "LRN_068",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.2,
    reverse: true,
    stemKey: "multi_path_thinking_reverse",
    text: {
      hu: "Többféle megoldási lehetőséget is képes fejben tartani.",
      en: "Can keep multiple possible solutions in mind."
    }
  },
  {
    id: "LRN_069",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.3,
    reverse: false,
    stemKey: "shifting_after_confusion",
    text: {
      hu: "Elakadás után nehezebben talál új kapaszkodót a továbblépéshez.",
      en: "After getting stuck, has more difficulty finding a new way forward."
    }
  },
  {
    id: "LRN_070",
    domain: "LEARNING",
    subdomain: "cognitive_flexibility",
    weight: 1.4,
    reverse: false,
    stemKey: "transition_between_task_types",
    text: {
      hu: "Nehezebben vált egyik feladattípusról a másikra.",
      en: "Finds it harder to switch from one task type to another."
    }
  },

  {
    id: "LRN_071",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.4,
    reverse: false,
    stemKey: "low_task_motivation",
    text: {
      hu: "Nehezebben talál belső motivációt a tanuláshoz.",
      en: "Finds it harder to access internal motivation for learning."
    }
  },
  {
    id: "LRN_072",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.4,
    reverse: false,
    stemKey: "effort_drop",
    text: {
      hu: "Könnyebben csökken az erőfeszítése, ha valami nem megy rögtön.",
      en: "Effort drops more easily when something is not immediately successful."
    }
  },
  {
    id: "LRN_073",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.2,
    reverse: true,
    stemKey: "persistence_reverse",
    text: {
      hu: "Általában kitart egy feladat mellett akkor is, ha az nehéz.",
      en: "Usually persists with a task even when it is difficult."
    }
  },
  {
    id: "LRN_074",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.3,
    reverse: false,
    stemKey: "low_reward_pull",
    text: {
      hu: "A siker vagy eredmény ígérete sem mindig elég húzóerő számára.",
      en: "The promise of success or reward is not always enough to pull effort forward."
    }
  },
  {
    id: "LRN_075",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.4,
    reverse: false,
    stemKey: "giving_up_early",
    text: {
      hu: "Hajlamos lehet túl korán feladni egy nehezebb feladatot.",
      en: "May be prone to giving up too early on harder tasks."
    }
  },
  {
    id: "LRN_076",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.3,
    reverse: false,
    stemKey: "starting_without_drive",
    text: {
      hu: "A feladat elkezdéséhez több külső ösztönzésre lehet szüksége.",
      en: "May need more external prompting to start a task."
    }
  },
  {
    id: "LRN_077",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.3,
    reverse: false,
    stemKey: "slow_reengagement_after_failure",
    text: {
      hu: "Kudarc vagy hiba után nehezebben lendül vissza a munkába.",
      en: "Has more difficulty re-engaging after failure or mistakes."
    }
  },
  {
    id: "LRN_078",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.2,
    reverse: true,
    stemKey: "goal_pull_reverse",
    text: {
      hu: "A célok többnyire segítenek neki fenntartani az erőfeszítését.",
      en: "Goals usually help maintain effort."
    }
  },
  {
    id: "LRN_079",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.4,
    reverse: false,
    stemKey: "fatigue_reduces_persistence",
    text: {
      hu: "Fáradtság esetén különösen gyorsan csökkenhet a kitartása.",
      en: "When tired, persistence may drop especially quickly."
    }
  },
  {
    id: "LRN_080",
    domain: "LEARNING",
    subdomain: "motivation_persistence",
    weight: 1.3,
    reverse: false,
    stemKey: "hard_task_avoidance",
    text: {
      hu: "A nehezebb feladatokhoz kisebb kedvvel közelít.",
      en: "Approaches more difficult tasks with less willingness."
    }
  },

  {
    id: "LRN_081",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.4,
    reverse: false,
    stemKey: "error_detection",
    text: {
      hu: "Nem mindig veszi észre időben a saját hibáit.",
      en: "Does not always notice own mistakes in time."
    }
  },
  {
    id: "LRN_082",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.3,
    reverse: false,
    stemKey: "checking_work",
    text: {
      hu: "Ritkábban ellenőrzi vissza a munkáját a hibák kiszűrésére.",
      en: "Checks work back less consistently to catch mistakes."
    }
  },
  {
    id: "LRN_083",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.2,
    reverse: true,
    stemKey: "self_review_reverse",
    text: {
      hu: "Általában képes átnézni és javítani a saját munkáját.",
      en: "Can usually review and correct own work."
    }
  },
  {
    id: "LRN_084",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.4,
    reverse: false,
    stemKey: "careless_misses",
    text: {
      hu: "Figyelmetlenségből könnyen benne maradnak hibák a munkájában.",
      en: "Mistakes may remain in work due to inattention."
    }
  },
  {
    id: "LRN_085",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.3,
    reverse: false,
    stemKey: "quality_monitoring",
    text: {
      hu: "Nehezebben méri fel, hogy a munkája mennyire pontos vagy teljes.",
      en: "Has more difficulty judging how accurate or complete the work is."
    }
  },
  {
    id: "LRN_086",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.4,
    reverse: false,
    stemKey: "feedback_integration",
    text: {
      hu: "Kapott visszajelzést nem mindig épít be a következő próbálkozásba.",
      en: "Does not always integrate feedback into the next attempt."
    }
  },
  {
    id: "LRN_087",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.3,
    reverse: false,
    stemKey: "answer_completion_check",
    text: {
      hu: "Előfordulhat, hogy úgy ad le munkát, hogy nem veszi észre a hiányzó részeket.",
      en: "May submit work without noticing missing parts."
    }
  },
  {
    id: "LRN_088",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.2,
    reverse: true,
    stemKey: "correction_awareness_reverse",
    text: {
      hu: "Többnyire észreveszi, ha valamiben korrigálnia kell.",
      en: "Usually notices when something needs correction."
    }
  },
  {
    id: "LRN_089",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.4,
    reverse: false,
    stemKey: "monitoring_while_working",
    text: {
      hu: "Munka közben nehezebben ellenőrzi saját haladását és pontosságát.",
      en: "Finds it harder to monitor progress and accuracy while working."
    }
  },
  {
    id: "LRN_090",
    domain: "LEARNING",
    subdomain: "self_monitoring_error_awareness",
    weight: 1.3,
    reverse: false,
    stemKey: "repeat_same_error",
    text: {
      hu: "Előfordulhat, hogy ugyanazt a hibát többször is megismétli.",
      en: "May repeat the same mistake multiple times."
    }
  },

  {
    id: "LRN_091",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.4,
    reverse: false,
    stemKey: "strategy_selection",
    text: {
      hu: "Nehezebben választja ki, milyen tanulási módszer lenne célravezető.",
      en: "Has more difficulty choosing an effective learning strategy."
    }
  },
  {
    id: "LRN_092",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.3,
    reverse: false,
    stemKey: "passive_learning",
    text: {
      hu: "Hajlamos lehet inkább passzívan átolvasni az anyagot, mint aktívan feldolgozni.",
      en: "May lean toward passively rereading rather than actively processing material."
    }
  },
  {
    id: "LRN_093",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.2,
    reverse: true,
    stemKey: "effective_strategy_reverse",
    text: {
      hu: "Általában képes a feladathoz illő tanulási módszert választani.",
      en: "Can usually choose a learning method that fits the task."
    }
  },
  {
    id: "LRN_094",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.4,
    reverse: false,
    stemKey: "poor_encoding_strategy",
    text: {
      hu: "Nehezebben alakít ki olyan módszert, ami segíti a megjegyzést.",
      en: "Finds it harder to build strategies that support remembering."
    }
  },
  {
    id: "LRN_095",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.3,
    reverse: false,
    stemKey: "lack_of_review_system",
    text: {
      hu: "Tanulásában kevésbé jelenik meg tudatos ismétlési rendszer.",
      en: "Learning shows less of a deliberate review system."
    }
  },
  {
    id: "LRN_096",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.4,
    reverse: false,
    stemKey: "one_size_strategy",
    text: {
      hu: "Ugyanazt a módszert próbálhatja minden helyzetben használni, akkor is, ha az nem elég hatékony.",
      en: "May try to use the same method in every situation even when it is not effective enough."
    }
  },
  {
    id: "LRN_097",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.3,
    reverse: false,
    stemKey: "difficulty_self_explaining",
    text: {
      hu: "Nehezebben magyarázza el saját szavaival a tanultakat.",
      en: "Has more difficulty explaining learned material in own words."
    }
  },
  {
    id: "LRN_098",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.2,
    reverse: true,
    stemKey: "adaptive_learning_reverse",
    text: {
      hu: "Képes rugalmasan változtatni a tanulási módszerén, ha szükséges.",
      en: "Can flexibly change learning methods when needed."
    }
  },
  {
    id: "LRN_099",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.4,
    reverse: false,
    stemKey: "shallow_processing",
    text: {
      hu: "Könnyebben marad felszínesebb feldolgozásnál, mint mélyebb megértésnél.",
      en: "More easily stays at a shallow level of processing rather than deeper understanding."
    }
  },
  {
    id: "LRN_100",
    domain: "LEARNING",
    subdomain: "learning_strategy",
    weight: 1.3,
    reverse: false,
    stemKey: "retrieval_practice_avoidance",
    text: {
      hu: "Kevésbé használ olyan módszereket, amelyek valódi felidézést igényelnek.",
      en: "Uses methods requiring true retrieval less often."
    }
  },

  {
    id: "LRN_101",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.3,
    reverse: false,
    stemKey: "noise_sensitivity_learning",
    text: {
      hu: "Zaj vagy háttérmozgás különösen megnehezítheti számára a tanulást.",
      en: "Noise or background movement may make learning especially difficult."
    }
  },
  {
    id: "LRN_102",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.3,
    reverse: false,
    stemKey: "workspace_dependence",
    text: {
      hu: "Erősen függ attól, mennyire rendezett vagy nyugodt a környezete.",
      en: "Performance depends strongly on how calm or organized the environment is."
    }
  },
  {
    id: "LRN_103",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.2,
    reverse: true,
    stemKey: "environment_adjustment_reverse",
    text: {
      hu: "Többféle környezetben is viszonylag jól tud tanulni.",
      en: "Can learn relatively well across different environments."
    }
  },
  {
    id: "LRN_104",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.3,
    reverse: false,
    stemKey: "visual_clutter_distraction",
    text: {
      hu: "A vizuális rendetlenség is könnyen elvonja a figyelmét.",
      en: "Visual clutter also easily distracts attention."
    }
  },
  {
    id: "LRN_105",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.4,
    reverse: false,
    stemKey: "location_transition_cost",
    text: {
      hu: "Új környezetben vagy helyzetben lassabban tud ráhangolódni a tanulásra.",
      en: "Takes longer to settle into learning in a new environment or setting."
    }
  },
  {
    id: "LRN_106",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.3,
    reverse: false,
    stemKey: "resource_setup_need",
    text: {
      hu: "Több környezeti támaszra lehet szüksége ahhoz, hogy jól tudjon dolgozni.",
      en: "May need more environmental supports to work well."
    }
  },
  {
    id: "LRN_107",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.3,
    reverse: false,
    stemKey: "group_environment_load",
    text: {
      hu: "Csoportos vagy mozgalmas környezetben könnyebben szétesik a figyelme.",
      en: "Attention breaks down more easily in group or busy environments."
    }
  },
  {
    id: "LRN_108",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.2,
    reverse: true,
    stemKey: "ambient_tolerance_reverse",
    text: {
      hu: "Többnyire zavaró körülmények mellett is tud viszonylag jól teljesíteni.",
      en: "Can usually perform relatively well even with some distracting surroundings."
    }
  },
  {
    id: "LRN_109",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.4,
    reverse: false,
    stemKey: "digital_distraction_load",
    text: {
      hu: "Digitális eszközök vagy értesítések különösen könnyen megakasztják.",
      en: "Digital devices or notifications especially easily interrupt attention."
    }
  },
  {
    id: "LRN_110",
    domain: "LEARNING",
    subdomain: "environmental_regulation",
    weight: 1.3,
    reverse: false,
    stemKey: "context_dependent_performance",
    text: {
      hu: "Teljesítménye erősen függhet a helyzettől és a környezeti feltételektől.",
      en: "Performance may depend strongly on context and environmental conditions."
    }
  },

  {
    id: "LRN_111",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.4,
    reverse: false,
    stemKey: "showing_knowledge",
    text: {
      hu: "Nehézséget okozhat számára megmutatni, hogy valójában mit tud.",
      en: "May find it difficult to show what is actually known."
    }
  },
  {
    id: "LRN_112",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.3,
    reverse: false,
    stemKey: "written_expression_load",
    text: {
      hu: "Írásban nehezebben rendezi össze a gondolatait.",
      en: "Finds it harder to organize thoughts in writing."
    }
  },
  {
    id: "LRN_113",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.2,
    reverse: true,
    stemKey: "clear_output_reverse",
    text: {
      hu: "Általában képes érthetően kifejezni a tudását.",
      en: "Can generally express knowledge clearly."
    }
  },
  {
    id: "LRN_114",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.4,
    reverse: false,
    stemKey: "answer_construction",
    text: {
      hu: "Válaszadásnál nehezebben építi fel logikusan a mondanivalóját.",
      en: "Has more difficulty building a response in a logical way."
    }
  },
  {
    id: "LRN_115",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.3,
    reverse: false,
    stemKey: "retrieval_to_output_gap",
    text: {
      hu: "Úgy tűnhet, többet tud, mint amit a teljesítményében meg tud mutatni.",
      en: "May seem to know more than can be shown in performance."
    }
  },
  {
    id: "LRN_116",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.4,
    reverse: false,
    stemKey: "under_pressure_output_breakdown",
    text: {
      hu: "Nyomás alatt könnyebben szétesik a teljesítménye, még ha tudja is az anyagot.",
      en: "Performance breaks down more easily under pressure even when the material is known."
    }
  },
  {
    id: "LRN_117",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.3,
    reverse: false,
    stemKey: "shortened_answers",
    text: {
      hu: "Válaszai néha rövidebbek vagy hiányosabbak lehetnek a tudásához képest.",
      en: "Responses may be shorter or more incomplete than actual knowledge would suggest."
    }
  },
  {
    id: "LRN_118",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.2,
    reverse: true,
    stemKey: "knowledge_transfer_reverse",
    text: {
      hu: "Többnyire sikerül átfordítania a tudását használható válaszokká vagy megoldásokká.",
      en: "Usually manages to turn knowledge into usable answers or solutions."
    }
  },
  {
    id: "LRN_119",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.4,
    reverse: false,
    stemKey: "verbal_expression_latency",
    text: {
      hu: "Szóban is több időt igényelhet, mire jól megfogalmazza a gondolatait.",
      en: "May also need more time verbally to formulate thoughts well."
    }
  },
  {
    id: "LRN_120",
    domain: "LEARNING",
    subdomain: "academic_expression_output",
    weight: 1.3,
    reverse: false,
    stemKey: "output_organization",
    text: {
      hu: "A gondolatok rendezése és kimeneti formába öntése külön erőfeszítést kívánhat tőle.",
      en: "Organizing thoughts into an output format may require extra effort."
    }
  },

  /* =========================
     121-250
  ========================= */

  ...(() => {
    const items = [];
    let num = 121;

    function makeId() {
      return `LRN_${String(num++).padStart(3, "0")}`;
    }

    function add(subdomain, weight, reverse, stemKey, hu, en) {
      items.push({
        id: makeId(),
        domain: "LEARNING",
        subdomain,
        weight,
        reverse,
        stemKey,
        text: { hu, en }
      });
    }

    const contexts = [
      { hu: "tanulás közben", en: "during learning" },
      { hu: "iskolai vagy munkahelyi helyzetekben", en: "in school or work situations" },
      { hu: "otthoni feladatoknál", en: "during home tasks" },
      { hu: "online tanulás során", en: "during online learning" },
      { hu: "időnyomás alatt", en: "under time pressure" }
    ];

    function contextualize(subdomain, weight, reverse, stemKey, huStem, enStem) {
      contexts.forEach((ctx) => {
        add(
          subdomain,
          weight,
          reverse,
          stemKey,
          `${huStem} ${ctx.hu}.`,
          `${enStem} ${ctx.en}.`
        );
      });
    }

    contextualize(
      "attention_focus",
      1.4,
      false,
      "sustained_attention",
      "Nehezen tartja fenn a figyelmét",
      "Has difficulty sustaining attention"
    );

    contextualize(
      "attention_focus",
      1.3,
      false,
      "distractibility_external",
      "Könnyen elterelik a külső ingerek",
      "Is easily distracted by external stimuli"
    );

    contextualize(
      "attention_focus",
      1.2,
      true,
      "focus_stability_reverse",
      "Viszonylag stabilan fenn tudja tartani a figyelmét",
      "Can maintain attention relatively steadily"
    );

    contextualize(
      "attention_focus",
      1.4,
      false,
      "task_reentry",
      "Megszakítás után nehezen talál vissza a feladathoz",
      "Has difficulty returning to a task after interruption"
    );

    contextualize(
      "attention_focus",
      1.3,
      false,
      "internal_distraction",
      "Saját gondolatai is könnyen eltérítik a fókuszát",
      "Own thoughts easily pull focus away"
    );

    contextualize(
      "working_memory",
      1.4,
      false,
      "holding_information",
      "Nehéz több információt egyszerre fejben tartania",
      "Has difficulty holding multiple pieces of information in mind at once"
    );

    contextualize(
      "working_memory",
      1.4,
      false,
      "multi_step_instructions",
      "Nehezebben követ több lépésből álló instrukciókat",
      "Has more difficulty following multi-step instructions"
    );

    contextualize(
      "working_memory",
      1.2,
      true,
      "memory_hold_reverse",
      "Többnyire képes több részletet is fejben tartani egyszerre",
      "Can usually hold several details in mind at once"
    );

    contextualize(
      "working_memory",
      1.3,
      false,
      "mental_tracking",
      "Könnyen elveszíti, hogy éppen hol tart",
      "Easily loses track of where things are"
    );

    contextualize(
      "working_memory",
      1.4,
      false,
      "updating_information",
      "Nehezen frissíti fejben az információkat munka közben",
      "Has difficulty mentally updating information while working"
    );

    contextualize(
      "processing_speed",
      1.4,
      false,
      "slow_processing",
      "Több időre van szüksége az információk feldolgozásához",
      "Needs more time to process information"
    );

    contextualize(
      "processing_speed",
      1.3,
      false,
      "response_delay",
      "Válaszadás előtt hosszabb időre van szüksége",
      "Needs more time before responding"
    );

    contextualize(
      "processing_speed",
      1.2,
      true,
      "fast_processing_reverse",
      "Viszonylag gyorsan át tudja látni az új információkat",
      "Can relatively quickly take in new information"
    );

    contextualize(
      "processing_speed",
      1.4,
      false,
      "slow_task_completion",
      "A feladatok befejezése lassabban megy számára",
      "Task completion tends to be slower"
    );

    contextualize(
      "processing_speed",
      1.3,
      false,
      "under_time_pressure_slowing",
      "Időnyomás alatt még inkább lelassulhat",
      "May slow down even more under time pressure"
    );

    contextualize(
      "executive_function",
      1.5,
      false,
      "task_initiation",
      "Nehezen kezdi el a feladatokat",
      "Has difficulty initiating tasks"
    );

    contextualize(
      "executive_function",
      1.4,
      false,
      "planning_difficulty",
      "Nehézséget okoz számára a tervezés",
      "Has difficulty planning"
    );

    contextualize(
      "executive_function",
      1.2,
      true,
      "organization_reverse",
      "Többnyire jól szervezi a feladatait",
      "Usually organizes tasks well"
    );

    contextualize(
      "executive_function",
      1.4,
      false,
      "task_completion",
      "Nehezen jut el a feladat végét jelentő lezárásig",
      "Has difficulty reaching task completion"
    );

    contextualize(
      "executive_function",
      1.3,
      false,
      "breaking_down_tasks",
      "Nehéz kisebb lépésekre bontania egy nagyobb feladatot",
      "Finds it hard to break a larger task into smaller steps"
    );

    contextualize(
      "organization_time_management",
      1.4,
      false,
      "time_estimation",
      "Nehezen becsüli meg, mennyi idő kell egy feladathoz",
      "Has difficulty estimating how much time a task will take"
    );

    contextualize(
      "organization_time_management",
      1.4,
      false,
      "deadline_management",
      "Nehezebben követi a határidőket és időkereteket",
      "Has more difficulty tracking deadlines and time limits"
    );

    contextualize(
      "organization_time_management",
      1.2,
      true,
      "time_structure_reverse",
      "Viszonylag jól tudja strukturálni az idejét",
      "Can structure time relatively well"
    );

    contextualize(
      "organization_time_management",
      1.3,
      false,
      "late_starting",
      "A szükségesnél később kezd neki a feladatoknak",
      "Starts tasks later than needed"
    );

    contextualize(
      "organization_time_management",
      1.3,
      false,
      "task_pacing",
      "Nehezen osztja be az idejét a feladaton belül",
      "Has difficulty pacing time within a task"
    );

    contextualize(
      "comprehension_language",
      1.4,
      false,
      "instruction_comprehension",
      "Elsőre nem mindig érti meg teljesen a feladatot",
      "Does not always fully understand a task the first time"
    );

    contextualize(
      "comprehension_language",
      1.3,
      false,
      "complex_sentence_parsing",
      "Összetettebb megfogalmazásokat nehezebben dolgoz fel",
      "Has more difficulty processing more complex wording"
    );

    contextualize(
      "comprehension_language",
      1.2,
      true,
      "verbal_understanding_reverse",
      "Többnyire jól követi a szóbeli magyarázatokat",
      "Usually follows verbal explanations well"
    );

    contextualize(
      "comprehension_language",
      1.4,
      false,
      "reading_comprehension_depth",
      "Olvasás után nehezebben ragadja meg a lényeget",
      "Has more difficulty grasping the main point after reading"
    );

    contextualize(
      "comprehension_language",
      1.3,
      false,
      "linking_concepts",
      "Nehezebben kapcsolja össze az új információt a meglévő tudásával",
      "Has more difficulty linking new information to existing knowledge"
    );

    contextualize(
      "cognitive_flexibility",
      1.4,
      false,
      "strategy_shifting",
      "Nehezen vált át más megoldási módra",
      "Has difficulty shifting to a different solution strategy"
    );

    contextualize(
      "cognitive_flexibility",
      1.3,
      false,
      "stuck_on_approach",
      "Hajlamos lehet benne ragadni egy nem működő megközelítésben",
      "May get stuck in an approach that is not working"
    );

    contextualize(
      "cognitive_flexibility",
      1.2,
      true,
      "flexible_adjustment_reverse",
      "Viszonylag könnyen tud módosítani a megközelítésén",
      "Can adjust approach relatively easily"
    );

    contextualize(
      "cognitive_flexibility",
      1.4,
      false,
      "switching_between_rules",
      "Nehezebben vált eltérő szabályok vagy szempontok között",
      "Has more difficulty switching between different rules or perspectives"
    );

    contextualize(
      "cognitive_flexibility",
      1.3,
      false,
      "transition_between_task_types",
      "Nehéz számára egyik feladattípusról a másikra átállni",
      "Finds it hard to switch from one task type to another"
    );

    contextualize(
      "motivation_persistence",
      1.4,
      false,
      "low_task_motivation",
      "Nehezebben talál belső motivációt a munkához",
      "Has more difficulty finding internal motivation for the work"
    );

    contextualize(
      "motivation_persistence",
      1.4,
      false,
      "effort_drop",
      "Könnyebben csökken az erőfeszítése, ha valami nem megy rögtön",
      "Effort drops more easily when something does not go well right away"
    );

    contextualize(
      "motivation_persistence",
      1.2,
      true,
      "persistence_reverse",
      "Többnyire képes kitartani a nehezebb feladatok mellett is",
      "Can usually persist even with harder tasks"
    );

    contextualize(
      "motivation_persistence",
      1.4,
      false,
      "giving_up_early",
      "Hajlamos lehet túl korán feladni a nehezebb feladatokat",
      "May give up too early on more difficult tasks"
    );

    contextualize(
      "motivation_persistence",
      1.3,
      false,
      "starting_without_drive",
      "Több külső ösztönzésre van szüksége az elinduláshoz",
      "Needs more external prompting to get started"
    );

    contextualize(
      "self_monitoring_error_awareness",
      1.4,
      false,
      "error_detection",
      "Nem mindig veszi észre időben a saját hibáit",
      "Does not always notice own mistakes in time"
    );

    contextualize(
      "self_monitoring_error_awareness",
      1.3,
      false,
      "checking_work",
      "Ritkábban nézi át vissza a munkáját hibakeresés céljából",
      "Reviews work back less consistently to catch errors"
    );

    contextualize(
      "self_monitoring_error_awareness",
      1.2,
      true,
      "self_review_reverse",
      "Többnyire képes ellenőrizni és javítani a saját munkáját",
      "Can usually check and correct own work"
    );

    contextualize(
      "self_monitoring_error_awareness",
      1.4,
      false,
      "monitoring_while_working",
      "Munka közben nehezebben tartja szem előtt a pontosságot",
      "Has more difficulty keeping accuracy in mind while working"
    );

    contextualize(
      "self_monitoring_error_awareness",
      1.3,
      false,
      "repeat_same_error",
      "Előfordulhat, hogy ugyanazt a hibát többször is megismétli",
      "May repeat the same mistake more than once"
    );

    contextualize(
      "learning_strategy",
      1.4,
      false,
      "strategy_selection",
      "Nehezebben választ célravezető tanulási módszert",
      "Has more difficulty choosing an effective learning method"
    );

    contextualize(
      "learning_strategy",
      1.3,
      false,
      "passive_learning",
      "Hajlamosabb lehet passzívan átnézni az anyagot aktív feldolgozás helyett",
      "May lean toward passively reviewing material instead of actively processing it"
    );

    contextualize(
      "learning_strategy",
      1.2,
      true,
      "effective_strategy_reverse",
      "Többnyire képes a helyzethez illő tanulási stratégiát választani",
      "Can usually choose a learning strategy that fits the situation"
    );

    contextualize(
      "learning_strategy",
      1.4,
      false,
      "poor_encoding_strategy",
      "Nehezebben alakít ki olyan módszert, ami segíti a megjegyzést",
      "Has more difficulty building methods that support remembering"
    );

    contextualize(
      "learning_strategy",
      1.3,
      false,
      "shallow_processing",
      "Könnyebben marad felszínesebb feldolgozásnál",
      "More easily stays at a shallower level of processing"
    );

    contextualize(
      "environmental_regulation",
      1.3,
      false,
      "noise_sensitivity_learning",
      "A környezeti zajok különösen megnehezítik számára a tanulást",
      "Environmental noise makes learning especially difficult"
    );

    contextualize(
      "environmental_regulation",
      1.3,
      false,
      "workspace_dependence",
      "Erősen függ attól, mennyire rendezett és nyugodt a környezete",
      "Performance depends strongly on how organized and calm the environment is"
    );

    contextualize(
      "environmental_regulation",
      1.2,
      true,
      "environment_adjustment_reverse",
      "Különböző környezetekben is viszonylag jól tud működni",
      "Can function relatively well across different environments"
    );

    contextualize(
      "environmental_regulation",
      1.4,
      false,
      "digital_distraction_load",
      "Digitális ingerek vagy értesítések könnyen megszakítják a figyelmét",
      "Digital stimuli or notifications easily interrupt attention"
    );

    contextualize(
      "environmental_regulation",
      1.3,
      false,
      "group_environment_load",
      "Mozgalmasabb közegben könnyebben szétesik a fókusza",
      "Focus breaks down more easily in busier environments"
    );

    contextualize(
      "academic_expression_output",
      1.4,
      false,
      "showing_knowledge",
      "Nehezebben tudja megmutatni, hogy valójában mit tud",
      "Has more difficulty showing what is actually known"
    );

    contextualize(
      "academic_expression_output",
      1.3,
      false,
      "written_expression_load",
      "Írásban nehezebben rendezi össze a gondolatait",
      "Finds it harder to organize thoughts in writing"
    );

    contextualize(
      "academic_expression_output",
      1.2,
      true,
      "clear_output_reverse",
      "Többnyire érthetően ki tudja fejezni a tudását",
      "Can usually express knowledge clearly"
    );

    contextualize(
      "academic_expression_output",
      1.4,
      false,
      "under_pressure_output_breakdown",
      "Nyomás alatt könnyebben szétesik a teljesítménye",
      "Performance breaks down more easily under pressure"
    );

    contextualize(
      "academic_expression_output",
      1.3,
      false,
      "output_organization",
      "A gondolatok rendezése és kimeneti formába öntése több erőfeszítést igényel",
      "Organizing thoughts into an output format requires more effort"
    );

    add(
      "learning_strategy",
      1.4,
      false,
      "retrieval_practice_gap",
      "Ritkábban használ olyan módszereket, amelyek valódi felidézést kérnek tőle.",
      "More rarely uses methods that require true retrieval practice."
    );

    add(
      "organization_time_management",
      1.3,
      false,
      "material_tracking",
      "Előfordulhat, hogy nehezebben követi, melyik anyaggal hol tart.",
      "May have more difficulty tracking where progress stands across materials."
    );

    add(
      "motivation_persistence",
      1.2,
      true,
      "reengagement_reverse",
      "Egy nehezebb pillanat után is képes lehet újra visszakapcsolódni a feladathoz.",
      "Can reconnect with a task even after a more difficult moment."
    );

    add(
      "working_memory",
      1.3,
      false,
      "remembering_requirements",
      "Nehéz fejben tartania, hogy pontosan mit kér tőle a feladat.",
      "Finds it difficult to keep in mind exactly what the task requires."
    );

    add(
      "attention_focus",
      1.3,
      false,
      "passive_attention_drop",
      "Hosszabb idejű hallgatás vagy figyelés közben könnyebben kiesik a fókuszból.",
      "During extended listening or attending, focus is more likely to drop."
    );

    return items.slice(0, 130);
})()
];