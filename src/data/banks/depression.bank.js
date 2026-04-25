export const DEPRESSION_BANK = [
  /* =========================
     CORE 1-120
  ========================= */

  {
    id: "DEP_001",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.5,
    reverse: false,
    stemKey: "persistent_sadness",
    text: {
      hu: "Gyakran tartós lehangoltság jellemzi.",
      en: "Is often characterized by persistent low mood."
    }
  },
  {
    id: "DEP_002",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.4,
    reverse: false,
    stemKey: "tearfulness",
    text: {
      hu: "Könnyebben elszomorodik vagy elérzékenyül, mint korábban.",
      en: "Becomes sad or tearful more easily than before."
    }
  },
  {
    id: "DEP_003",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.3,
    reverse: false,
    stemKey: "emotional_heaviness",
    text: {
      hu: "Mintha érzelmileg nehezebb lenne számára a mindennapok megélése.",
      en: "Daily life may feel emotionally heavier."
    }
  },
  {
    id: "DEP_004",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.4,
    reverse: false,
    stemKey: "morning_low_mood",
    text: {
      hu: "A nap kezdetén különösen nehéznek érezheti magát.",
      en: "May feel especially low at the start of the day."
    }
  },
  {
    id: "DEP_005",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.2,
    reverse: true,
    stemKey: "stable_mood_reverse",
    text: {
      hu: "Hangulata többnyire kiegyensúlyozott tud maradni.",
      en: "Mood can usually remain relatively stable."
    }
  },
  {
    id: "DEP_006",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.4,
    reverse: false,
    stemKey: "hopeless_tone",
    text: {
      hu: "Beszédében vagy hozzáállásában gyakran megjelenik reménytelenség.",
      en: "Hopelessness often appears in speech or attitude."
    }
  },
  {
    id: "DEP_007",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.3,
    reverse: false,
    stemKey: "mood_drop_without_clear_reason",
    text: {
      hu: "Hangulata néha látható ok nélkül is lecsökken.",
      en: "Mood may drop even without a clear reason."
    }
  },
  {
    id: "DEP_008",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.3,
    reverse: false,
    stemKey: "flat_sad_presence",
    text: {
      hu: "Lehangoltsága inkább csendes, tartós jelenlétként érződik.",
      en: "Low mood may feel more like a quiet, ongoing presence."
    }
  },
  {
    id: "DEP_009",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.2,
    reverse: true,
    stemKey: "mood_recovery_reverse",
    text: {
      hu: "Egy rosszabb pillanat után viszonylag könnyen vissza tud térni egy jobb állapotba.",
      en: "Can recover relatively easily after a low moment."
    }
  },
  {
    id: "DEP_010",
    domain: "DEPRESSION",
    subdomain: "low_mood",
    weight: 1.4,
    reverse: false,
    stemKey: "lingering_sadness",
    text: {
      hu: "A szomorúság érzése hosszabban benne maradhat.",
      en: "Feelings of sadness may linger for a long time."
    }
  },

  {
    id: "DEP_011",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.5,
    reverse: false,
    stemKey: "reduced_pleasure",
    text: {
      hu: "Kevésbé tud örülni azoknak a dolgoknak, amelyek korábban örömet adtak.",
      en: "Gets less pleasure from things that used to feel enjoyable."
    }
  },
  {
    id: "DEP_012",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.4,
    reverse: false,
    stemKey: "interest_loss",
    text: {
      hu: "Érdeklődése több területen is csökkenhet.",
      en: "Interest may decrease across several areas."
    }
  },
  {
    id: "DEP_013",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.4,
    reverse: false,
    stemKey: "hobby_withdrawal",
    text: {
      hu: "Korábban kedvelt tevékenységektől is eltávolodhat.",
      en: "May pull away even from activities once enjoyed."
    }
  },
  {
    id: "DEP_014",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.3,
    reverse: false,
    stemKey: "positive_response_blunting",
    text: {
      hu: "A pozitív élmények kevésbé mozgatják meg érzelmileg.",
      en: "Positive experiences have less emotional impact."
    }
  },
  {
    id: "DEP_015",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.2,
    reverse: true,
    stemKey: "pleasure_access_reverse",
    text: {
      hu: "Továbbra is képes örömöt találni a számára fontos dolgokban.",
      en: "Can still find enjoyment in important things."
    }
  },
  {
    id: "DEP_016",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.4,
    reverse: false,
    stemKey: "motivation_for_fun_loss",
    text: {
      hu: "Még a kellemes programokhoz is nehezebb kedvet kapnia.",
      en: "Even pleasant activities are harder to feel motivated for."
    }
  },
  {
    id: "DEP_017",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.3,
    reverse: false,
    stemKey: "social_enjoyment_loss",
    text: {
      hu: "A társas élmények is kevésbé tűnnek vonzónak számára.",
      en: "Social experiences may feel less appealing."
    }
  },
  {
    id: "DEP_018",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.4,
    reverse: false,
    stemKey: "emotional_numb_pleasure",
    text: {
      hu: "Olykor mintha érzelmileg tompábban reagálna örömteli dolgokra is.",
      en: "May react more emotionally flat even to pleasant things."
    }
  },
  {
    id: "DEP_019",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.2,
    reverse: true,
    stemKey: "engagement_reverse",
    text: {
      hu: "Általában képes bevonódni olyan tevékenységekbe, amelyek örömet adhatnak.",
      en: "Can usually engage in activities that may bring enjoyment."
    }
  },
  {
    id: "DEP_020",
    domain: "DEPRESSION",
    subdomain: "anhedonia_interest_loss",
    weight: 1.4,
    reverse: false,
    stemKey: "anticipatory_pleasure_loss",
    text: {
      hu: "Már előre sem várja annyira a kellemes dolgokat, mint korábban.",
      en: "No longer looks forward to pleasant things as much as before."
    }
  },

  {
    id: "DEP_021",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.5,
    reverse: false,
    stemKey: "low_energy",
    text: {
      hu: "Gyakran kevés energiát érez magában a mindennapokhoz.",
      en: "Often feels low on energy for daily life."
    }
  },
  {
    id: "DEP_022",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.4,
    reverse: false,
    stemKey: "mental_and_physical_exhaustion",
    text: {
      hu: "Fáradtsága mentálisan és testileg is megjelenhet.",
      en: "Fatigue may appear both mentally and physically."
    }
  },
  {
    id: "DEP_023",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.4,
    reverse: false,
    stemKey: "effortful_daily_tasks",
    text: {
      hu: "A hétköznapi feladatok is a szokásosnál nagyobb erőfeszítést igényelhetnek.",
      en: "Even ordinary tasks may require more effort than usual."
    }
  },
  {
    id: "DEP_024",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.3,
    reverse: false,
    stemKey: "slow_starting",
    text: {
      hu: "Nehezen lendül bele a napjába vagy egy-egy feladatba.",
      en: "Has difficulty getting started with the day or with tasks."
    }
  },
  {
    id: "DEP_025",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.2,
    reverse: true,
    stemKey: "energy_availability_reverse",
    text: {
      hu: "Többnyire rendelkezésére áll elég energia a napi teendőkhöz.",
      en: "Usually has enough energy for daily responsibilities."
    }
  },
  {
    id: "DEP_026",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.4,
    reverse: false,
    stemKey: "fatigue_not_restored",
    text: {
      hu: "Pihenés után sem mindig érzi magát igazán feltöltődve.",
      en: "Does not always feel restored even after rest."
    }
  },
  {
    id: "DEP_027",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.3,
    reverse: false,
    stemKey: "daytime_heaviness",
    text: {
      hu: "A nap során gyakran nehézkesség vagy kimerültség érzése kíséri.",
      en: "A sense of heaviness or exhaustion often follows through the day."
    }
  },
  {
    id: "DEP_028",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.3,
    reverse: false,
    stemKey: "effort_to_continue",
    text: {
      hu: "Nehezebb számára hosszan fenntartani az aktivitást.",
      en: "It is harder to sustain activity over time."
    }
  },
  {
    id: "DEP_029",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.2,
    reverse: true,
    stemKey: "task_stamina_reverse",
    text: {
      hu: "Többnyire végig tud vinni feladatokat anélkül, hogy gyorsan kimerülne.",
      en: "Can usually continue tasks without tiring too quickly."
    }
  },
  {
    id: "DEP_030",
    domain: "DEPRESSION",
    subdomain: "energy_fatigue",
    weight: 1.4,
    reverse: false,
    stemKey: "basic_activation_difficulty",
    text: {
      hu: "Az alapvető tevékenységekhez is nehezebb mozgósítania magát.",
      en: "Even basic activities may be harder to mobilize for."
    }
  },

  {
    id: "DEP_031",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.5,
    reverse: false,
    stemKey: "low_self_worth",
    text: {
      hu: "Gyakran gondolhat magára kevésbé értékes emberként.",
      en: "May often think of self as less valuable."
    }
  },
  {
    id: "DEP_032",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.4,
    reverse: false,
    stemKey: "excessive_guilt",
    text: {
      hu: "A hibáit vagy hiányosságait túlzottan súlyosnak élheti meg.",
      en: "May experience mistakes or shortcomings as overly serious."
    }
  },
  {
    id: "DEP_033",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.4,
    reverse: false,
    stemKey: "self_criticism",
    text: {
      hu: "Szigorúan, bántóan kritikus lehet önmagával szemben.",
      en: "May be harshly self-critical."
    }
  },
  {
    id: "DEP_034",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.3,
    reverse: false,
    stemKey: "failure_identity",
    text: {
      hu: "Hajlamos lehet úgy érezni, hogy nem elég jó.",
      en: "May tend to feel not good enough."
    }
  },
  {
    id: "DEP_035",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.2,
    reverse: true,
    stemKey: "self_acceptance_reverse",
    text: {
      hu: "Többnyire képes együttérzően viszonyulni önmagához.",
      en: "Can usually relate to self with compassion."
    }
  },
  {
    id: "DEP_036",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.4,
    reverse: false,
    stemKey: "blaming_self",
    text: {
      hu: "Könnyen saját hibájának tulajdoníthat rossz dolgokat.",
      en: "May easily blame self when things go wrong."
    }
  },
  {
    id: "DEP_037",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.3,
    reverse: false,
    stemKey: "shame_presence",
    text: {
      hu: "A szégyen érzése gyakrabban megjelenhet benne.",
      en: "Feelings of shame may be more present."
    }
  },
  {
    id: "DEP_038",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.3,
    reverse: false,
    stemKey: "not_deserving_good",
    text: {
      hu: "Előfordulhat, hogy kevésbé érzi magát érdemesnek a jó dolgokra.",
      en: "May feel less deserving of good things."
    }
  },
  {
    id: "DEP_039",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.2,
    reverse: true,
    stemKey: "balanced_self_view_reverse",
    text: {
      hu: "Tud reálisabban tekinteni az erősségeire és gyengeségeire is.",
      en: "Can view strengths and weaknesses in a balanced way."
    }
  },
  {
    id: "DEP_040",
    domain: "DEPRESSION",
    subdomain: "self_worth_guilt",
    weight: 1.4,
    reverse: false,
    stemKey: "worthlessness_theme",
    text: {
      hu: "Gondolataiban időnként megjelenhet az értéktelenség érzése.",
      en: "Thoughts of worthlessness may sometimes appear."
    }
  },

  {
    id: "DEP_041",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.5,
    reverse: false,
    stemKey: "future_hopelessness",
    text: {
      hu: "A jövővel kapcsolatban gyakran kevésbé lát reményteli lehetőségeket.",
      en: "Often sees fewer hopeful possibilities in the future."
    }
  },
  {
    id: "DEP_042",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.4,
    reverse: false,
    stemKey: "nothing_will_change",
    text: {
      hu: "Úgy érezheti, hogy a dolgok nemigen fognak javulni.",
      en: "May feel that things are unlikely to improve."
    }
  },
  {
    id: "DEP_043",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.4,
    reverse: false,
    stemKey: "future_blocked",
    text: {
      hu: "A jövő nehezen elképzelhető vagy beszűkültnek tűnhet számára.",
      en: "The future may seem hard to imagine or narrowed down."
    }
  },
  {
    id: "DEP_044",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.3,
    reverse: false,
    stemKey: "low_expectancy",
    text: {
      hu: "Kevésbé számít arra, hogy jó dolgok történnek majd vele.",
      en: "Expects positive things less often."
    }
  },
  {
    id: "DEP_045",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.2,
    reverse: true,
    stemKey: "future_open_reverse",
    text: {
      hu: "Továbbra is lát maga előtt értelmes vagy reményteli irányokat.",
      en: "Still sees meaningful or hopeful directions ahead."
    }
  },
  {
    id: "DEP_046",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.4,
    reverse: false,
    stemKey: "discouraged_outlook",
    text: {
      hu: "Hozzáállásában gyakran megjelenik a kedvetlenség a jövővel kapcsolatban.",
      en: "Discouragement about the future often appears in outlook."
    }
  },
  {
    id: "DEP_047",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.3,
    reverse: false,
    stemKey: "lack_of_positive_expectation",
    text: {
      hu: "Nehezebb számára valami igazán jóra számítani.",
      en: "It is harder to expect something genuinely good."
    }
  },
  {
    id: "DEP_048",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.3,
    reverse: false,
    stemKey: "future_effort_pointlessness",
    text: {
      hu: "Időnként úgy tűnhet számára, hogy kevés értelme van az erőfeszítéseknek.",
      en: "At times, effort may seem to have little point."
    }
  },
  {
    id: "DEP_049",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.2,
    reverse: true,
    stemKey: "improvement_possible_reverse",
    text: {
      hu: "Általában el tudja képzelni, hogy a jelenlegi nehézségek idővel enyhülhetnek.",
      en: "Can usually imagine that current difficulties may ease over time."
    }
  },
  {
    id: "DEP_050",
    domain: "DEPRESSION",
    subdomain: "hopelessness_future",
    weight: 1.4,
    reverse: false,
    stemKey: "future_blankness",
    text: {
      hu: "A jövő néha üresnek vagy nehezen megragadhatónak tűnhet.",
      en: "The future may sometimes feel blank or hard to grasp."
    }
  },

  {
    id: "DEP_051",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.4,
    reverse: false,
    stemKey: "focus_difficulty",
    text: {
      hu: "Nehezebben tud tartósan figyelni vagy koncentrálni.",
      en: "Has more difficulty sustaining attention or concentration."
    }
  },
  {
    id: "DEP_052",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.4,
    reverse: false,
    stemKey: "decision_difficulty",
    text: {
      hu: "A döntéshozatal a szokásosnál megterhelőbb lehet számára.",
      en: "Making decisions may feel more burdensome than usual."
    }
  },
  {
    id: "DEP_053",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.3,
    reverse: false,
    stemKey: "mental_slowness",
    text: {
      hu: "Gondolkodása néha lelassultnak vagy nehézkesnek tűnhet.",
      en: "Thinking may sometimes seem slowed down or effortful."
    }
  },
  {
    id: "DEP_054",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.3,
    reverse: false,
    stemKey: "forgetful_due_to_low_mood",
    text: {
      hu: "Lehangoltság mellett könnyebben széteshet a figyelme.",
      en: "Low mood may make attention more fragmented."
    }
  },
  {
    id: "DEP_055",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.2,
    reverse: true,
    stemKey: "clear_thinking_reverse",
    text: {
      hu: "Általában képes tisztán átgondolni a helyzeteket.",
      en: "Can usually think situations through clearly."
    }
  },
  {
    id: "DEP_056",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.3,
    reverse: false,
    stemKey: "starting_task_confusion",
    text: {
      hu: "Egy feladat elkezdésekor nehezebben találhatja meg a fókuszt.",
      en: "May struggle more to find focus when starting a task."
    }
  },
  {
    id: "DEP_057",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.4,
    reverse: false,
    stemKey: "small_decision_burden",
    text: {
      hu: "Még kisebb döntések is aránytalanul megterhelőnek tűnhetnek.",
      en: "Even small decisions may feel disproportionately difficult."
    }
  },
  {
    id: "DEP_058",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.3,
    reverse: false,
    stemKey: "mental_fog",
    text: {
      hu: "Időnként mintha ködösebbnek érezné a gondolkodását.",
      en: "Thinking may sometimes feel foggier."
    }
  },
  {
    id: "DEP_059",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.2,
    reverse: true,
    stemKey: "decision_flow_reverse",
    text: {
      hu: "Többnyire képes döntéseket hozni anélkül, hogy túlságosan elakadna.",
      en: "Can usually make decisions without getting too stuck."
    }
  },
  {
    id: "DEP_060",
    domain: "DEPRESSION",
    subdomain: "concentration_decision",
    weight: 1.4,
    reverse: false,
    stemKey: "attention_drift",
    text: {
      hu: "Könnyebben elkalandozik vagy elveszíti a mentális fonalat.",
      en: "More easily loses the thread of attention."
    }
  },

  {
    id: "DEP_061",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.4,
    reverse: false,
    stemKey: "sleep_disturbance",
    text: {
      hu: "Alvása kevésbé pihentető vagy nyugodt lehet.",
      en: "Sleep may feel less restful or settled."
    }
  },
  {
    id: "DEP_062",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.4,
    reverse: false,
    stemKey: "falling_asleep_difficulty",
    text: {
      hu: "Nehezebben alszik el, mint szeretne.",
      en: "Has more difficulty falling asleep than desired."
    }
  },
  {
    id: "DEP_063",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.3,
    reverse: false,
    stemKey: "night_waking",
    text: {
      hu: "Éjszaka többször felébredhet vagy nyugtalanabbul alhat.",
      en: "May wake multiple times or sleep more restlessly."
    }
  },
  {
    id: "DEP_064",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.3,
    reverse: false,
    stemKey: "oversleeping_tendency",
    text: {
      hu: "Néha a szokottnál többet szeretne aludni vagy feküdni.",
      en: "May want to sleep or stay in bed more than usual."
    }
  },
  {
    id: "DEP_065",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.2,
    reverse: true,
    stemKey: "restorative_sleep_reverse",
    text: {
      hu: "Alvása többnyire pihentető és helyreállító tud lenni.",
      en: "Sleep is usually restorative."
    }
  },
  {
    id: "DEP_066",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.3,
    reverse: false,
    stemKey: "morning_heaviness",
    text: {
      hu: "Ébredés után gyakran nehéznek vagy kimerültnek érzi magát.",
      en: "Often feels heavy or exhausted after waking."
    }
  },
  {
    id: "DEP_067",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.4,
    reverse: false,
    stemKey: "nonrestorative_sleep",
    text: {
      hu: "Alvás után sem feltétlenül érzi magát kipihentnek.",
      en: "Does not necessarily feel rested even after sleep."
    }
  },
  {
    id: "DEP_068",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.3,
    reverse: false,
    stemKey: "sleep_schedule_shift",
    text: {
      hu: "Alvási ritmusa könnyebben felborulhat.",
      en: "Sleep schedule may become more disrupted."
    }
  },
  {
    id: "DEP_069",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.2,
    reverse: true,
    stemKey: "wake_recovery_reverse",
    text: {
      hu: "Ébredés után többnyire viszonylag gyorsan magához tér.",
      en: "Usually recovers relatively quickly after waking."
    }
  },
  {
    id: "DEP_070",
    domain: "DEPRESSION",
    subdomain: "sleep_change",
    weight: 1.3,
    reverse: false,
    stemKey: "staying_in_bed",
    text: {
      hu: "Nehéz lehet számára felkelni vagy elindítani a napot.",
      en: "Getting up and starting the day may be difficult."
    }
  },

  {
    id: "DEP_071",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "appetite_reduction",
    text: {
      hu: "Étvágya csökkenhet vagy rendszertelenebbé válhat.",
      en: "Appetite may decrease or become more irregular."
    }
  },
  {
    id: "DEP_072",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "comfort_eating",
    text: {
      hu: "Előfordulhat, hogy hangulata miatt többet eszik a szokásosnál.",
      en: "May eat more than usual because of mood."
    }
  },
  {
    id: "DEP_073",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "body_heaviness",
    text: {
      hu: "Testileg nehézkesebbnek vagy terheltebbnek érezheti magát.",
      en: "May feel physically heavier or burdened."
    }
  },
  {
    id: "DEP_074",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.2,
    reverse: true,
    stemKey: "stable_appetite_reverse",
    text: {
      hu: "Étkezése és étvágya többnyire kiegyensúlyozott marad.",
      en: "Eating and appetite usually remain fairly stable."
    }
  },
  {
    id: "DEP_075",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "reduced_hunger_signals",
    text: {
      hu: "Kevésbé figyel vagy reagál az éhségjelzésekre.",
      en: "May notice or respond less to hunger signals."
    }
  },
  {
    id: "DEP_076",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "low_drive_for_meals",
    text: {
      hu: "Az étkezés megszervezése vagy elkezdése is nehéznek tűnhet.",
      en: "Planning or starting meals may feel difficult."
    }
  },
  {
    id: "DEP_077",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.2,
    reverse: true,
    stemKey: "body_care_reverse",
    text: {
      hu: "Többnyire képes figyelni teste alapvető szükségleteire.",
      en: "Can usually attend to basic bodily needs."
    }
  },
  {
    id: "DEP_078",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "meal_skipping",
    text: {
      hu: "Gyakrabban kihagyhat étkezéseket vagy halogathatja őket.",
      en: "May skip or delay meals more often."
    }
  },
  {
    id: "DEP_079",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.3,
    reverse: false,
    stemKey: "body_discomfort_low_mood",
    text: {
      hu: "Hangulati nehézségek mellett testileg is rosszabb közérzet jelenhet meg.",
      en: "Mood difficulties may come with worse physical well-being."
    }
  },
  {
    id: "DEP_080",
    domain: "DEPRESSION",
    subdomain: "appetite_body_change",
    weight: 1.2,
    reverse: true,
    stemKey: "rhythm_regulation_reverse",
    text: {
      hu: "Általában fenn tud tartani egy viszonylag rendezett napi ritmust.",
      en: "Can usually maintain a relatively organized daily rhythm."
    }
  },

  {
    id: "DEP_081",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.4,
    reverse: false,
    stemKey: "social_withdrawal",
    text: {
      hu: "Hajlamosabb lehet visszahúzódni másoktól.",
      en: "May become more withdrawn from others."
    }
  },
  {
    id: "DEP_082",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.4,
    reverse: false,
    stemKey: "reduced_contact",
    text: {
      hu: "Kevesebb kedve lehet kapcsolatot keresni vagy fenntartani.",
      en: "May have less desire to seek or maintain contact."
    }
  },
  {
    id: "DEP_083",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.3,
    reverse: false,
    stemKey: "prefers_aloneness_low_mood",
    text: {
      hu: "Lehangoltabban inkább egyedül maradna.",
      en: "When feeling low, would rather be alone."
    }
  },
  {
    id: "DEP_084",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.3,
    reverse: false,
    stemKey: "social_effort_burden",
    text: {
      hu: "A társas jelenlét több energiát vehet ki belőle, mint korábban.",
      en: "Being around others may feel more draining than before."
    }
  },
  {
    id: "DEP_085",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.2,
    reverse: true,
    stemKey: "connection_access_reverse",
    text: {
      hu: "Továbbra is képes kapcsolódni másokhoz, ha szüksége van rá.",
      en: "Can still reach for connection when needed."
    }
  },
  {
    id: "DEP_086",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.3,
    reverse: false,
    stemKey: "canceling_social",
    text: {
      hu: "Könnyebben lemondhat társas programokat vagy találkozásokat.",
      en: "May cancel social plans more easily."
    }
  },
  {
    id: "DEP_087",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.4,
    reverse: false,
    stemKey: "feeling_disconnected",
    text: {
      hu: "Mások mellett is távolinak vagy leváltnak érezheti magát.",
      en: "May feel distant or disconnected even around others."
    }
  },
  {
    id: "DEP_088",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.3,
    reverse: false,
    stemKey: "less_reaching_out",
    text: {
      hu: "Kevésbé kezdeményez beszélgetést vagy kapcsolódást.",
      en: "Initiates conversation or connection less often."
    }
  },
  {
    id: "DEP_089",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.2,
    reverse: true,
    stemKey: "social_return_reverse",
    text: {
      hu: "Egy nehezebb időszakban is képes visszatalálni másokhoz.",
      en: "Can still return to others even during a hard period."
    }
  },
  {
    id: "DEP_090",
    domain: "DEPRESSION",
    subdomain: "withdrawal_isolation",
    weight: 1.4,
    reverse: false,
    stemKey: "isolation_comfort",
    text: {
      hu: "Néha az elszigetelődés tűnhet a legkönnyebb megoldásnak.",
      en: "Isolation may sometimes feel like the easiest option."
    }
  },

  {
    id: "DEP_091",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "slowed_movement",
    text: {
      hu: "Mozdulatai vagy tevékenységei lelassultabbnak tűnhetnek.",
      en: "Movement or activity may seem slower."
    }
  },
  {
    id: "DEP_092",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "slowed_speech",
    text: {
      hu: "Beszéde néha lassabbá vagy halkabbá válhat.",
      en: "Speech may become slower or quieter."
    }
  },
  {
    id: "DEP_093",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "reduced_initiation",
    text: {
      hu: "Nehezebben indít el mozdulatokat, feladatokat vagy válaszokat.",
      en: "Has more difficulty initiating actions, tasks, or responses."
    }
  },
  {
    id: "DEP_094",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "restless_low_mood",
    text: {
      hu: "Máskor inkább nyugtalanabb, feszültebb mozgás jelenhet meg.",
      en: "At other times, low mood may show up as restless movement."
    }
  },
  {
    id: "DEP_095",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.2,
    reverse: true,
    stemKey: "natural_pace_reverse",
    text: {
      hu: "Mozgása és beszéde többnyire természetes tempóban marad.",
      en: "Movement and speech usually remain at a natural pace."
    }
  },
  {
    id: "DEP_096",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "body_dragging",
    text: {
      hu: "Mintha nehezebben vinné előre magát fizikailag is.",
      en: "May seem to drag physically through tasks."
    }
  },
  {
    id: "DEP_097",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "reduced_expressiveness",
    text: {
      hu: "Testi és érzelmi kifejezőkészsége visszafogottabb lehet.",
      en: "Physical and emotional expressiveness may be more reduced."
    }
  },
  {
    id: "DEP_098",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.2,
    reverse: true,
    stemKey: "responsiveness_reverse",
    text: {
      hu: "Általában kellően gyorsan és élénken tud reagálni.",
      en: "Usually responds with adequate speed and liveliness."
    }
  },
  {
    id: "DEP_099",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "low_drive_posture",
    text: {
      hu: "Tartásán vagy jelenlétén is érződhet a csökkent belső hajtóerő.",
      en: "Reduced inner drive may show in posture or general presence."
    }
  },
  {
    id: "DEP_100",
    domain: "DEPRESSION",
    subdomain: "psychomotor_change",
    weight: 1.3,
    reverse: false,
    stemKey: "hesitant_action",
    text: {
      hu: "Cselekvésében több habozás vagy megtorpanás jelenhet meg.",
      en: "Action may involve more hesitation or stopping."
    }
  },

  {
    id: "DEP_101",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.4,
    reverse: false,
    stemKey: "loss_of_meaning",
    text: {
      hu: "Kevesebb értelmet vagy célt érezhet a mindennapi tevékenységekben.",
      en: "May feel less meaning or purpose in everyday activities."
    }
  },
  {
    id: "DEP_102",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.4,
    reverse: false,
    stemKey: "why_bother_feeling",
    text: {
      hu: "Időnként úgy érezheti, hogy nehéz indokot találni az erőfeszítésre.",
      en: "At times, it may be hard to find a reason to make the effort."
    }
  },
  {
    id: "DEP_103",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.3,
    reverse: false,
    stemKey: "goal_disconnection",
    text: {
      hu: "Korábbi céljai vagy tervei távolibbnak, idegenebbnek tűnhetnek.",
      en: "Previous goals or plans may feel more distant or unfamiliar."
    }
  },
  {
    id: "DEP_104",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.3,
    reverse: false,
    stemKey: "reduced_drive",
    text: {
      hu: "A belső hajtóerő és lendület érezhetően csökkenhet.",
      en: "Inner drive and momentum may noticeably decrease."
    }
  },
  {
    id: "DEP_105",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.2,
    reverse: true,
    stemKey: "purpose_access_reverse",
    text: {
      hu: "Továbbra is képes kapcsolódni ahhoz, mi fontos számára.",
      en: "Can still connect with what matters personally."
    }
  },
  {
    id: "DEP_106",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.3,
    reverse: false,
    stemKey: "starting_without_pull",
    text: {
      hu: "Gyakran akkor is nehéz elindulnia, ha tudja, mit kellene tennie.",
      en: "Often finds it hard to get started even when knowing what to do."
    }
  },
  {
    id: "DEP_107",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.4,
    reverse: false,
    stemKey: "empty_progress",
    text: {
      hu: "Az előrehaladás sem mindig hoz valódi elégedettséget vagy lendületet.",
      en: "Progress does not always bring real satisfaction or momentum."
    }
  },
  {
    id: "DEP_108",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.2,
    reverse: true,
    stemKey: "goal_reengagement_reverse",
    text: {
      hu: "Képes újra kapcsolódni célokhoz vagy feladatokhoz, ha szükséges.",
      en: "Can reconnect with goals or tasks when needed."
    }
  },
  {
    id: "DEP_109",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.3,
    reverse: false,
    stemKey: "motivation_flattening",
    text: {
      hu: "Motivációja laposabbnak vagy kevésbé élőnek tűnhet.",
      en: "Motivation may feel flatter or less alive."
    }
  },
  {
    id: "DEP_110",
    domain: "DEPRESSION",
    subdomain: "meaning_motivation",
    weight: 1.4,
    reverse: false,
    stemKey: "effort_without_reward",
    text: {
      hu: "Az erőfeszítés és a belső jutalom érzése kevésbé kapcsolódhat össze.",
      en: "Effort may feel less connected to any inner sense of reward."
    }
  },

  {
    id: "DEP_111",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.4,
    reverse: false,
    stemKey: "feeling_like_burden",
    text: {
      hu: "Előfordulhat, hogy tehernek érzi magát mások számára.",
      en: "May sometimes feel like a burden to others."
    }
  },
  {
    id: "DEP_112",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.4,
    reverse: false,
    stemKey: "others_better_without_me_theme",
    text: {
      hu: "Gondolataiban megjelenhet, hogy másoknak nélküle könnyebb lenne.",
      en: "Thoughts may appear that others would have it easier without them."
    }
  },
  {
    id: "DEP_113",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.3,
    reverse: false,
    stemKey: "dark_inner_narrative",
    text: {
      hu: "Belső gondolatai időnként sötétebbé vagy leértékelőbbé válhatnak.",
      en: "Inner thoughts may sometimes become darker or more self-devaluing."
    }
  },
  {
    id: "DEP_114",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.3,
    reverse: false,
    stemKey: "disappearing_wish_passive",
    text: {
      hu: "Előfordulhat, hogy inkább eltűnne vagy kivonulna a világból.",
      en: "May sometimes wish to disappear or withdraw from the world."
    }
  },
  {
    id: "DEP_115",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.2,
    reverse: true,
    stemKey: "felt_value_reverse",
    text: {
      hu: "Továbbra is tud kapcsolódni ahhoz, hogy jelenléte számít másoknak.",
      en: "Can still connect with the sense that presence matters to others."
    }
  },
  {
    id: "DEP_116",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.4,
    reverse: false,
    stemKey: "detachment_from_life",
    text: {
      hu: "Időnként kevésbé érzi magát kapcsolódónak az élethez vagy a mindennapokhoz.",
      en: "May at times feel less connected to life or daily existence."
    }
  },
  {
    id: "DEP_117",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.3,
    reverse: false,
    stemKey: "low_reason_to_reach",
    text: {
      hu: "Nehezebb lehet okot találni arra, hogy segítséget vagy kapcsolódást keressen.",
      en: "May find it harder to see a reason to seek help or connection."
    }
  },
  {
    id: "DEP_118",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.2,
    reverse: true,
    stemKey: "life_anchor_reverse",
    text: {
      hu: "Többnyire képes kapcsolódni olyan dolgokhoz vagy emberekhez, amelyek megtartják.",
      en: "Can usually connect with people or things that provide stability."
    }
  },
  {
    id: "DEP_119",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.4,
    reverse: false,
    stemKey: "inner_disappearance_fantasy",
    text: {
      hu: "Megjelenhet benne a vágy, hogy ne kelljen jelen lennie vagy mindent viselnie.",
      en: "May wish not to have to be present or carry everything."
    }
  },
  {
    id: "DEP_120",
    domain: "DEPRESSION",
    subdomain: "burdensomeness_dark_thoughts",
    weight: 1.3,
    reverse: false,
    stemKey: "withdraw_from_visibility",
    text: {
      hu: "Legszívesebben láthatatlanná válna vagy nem terhelne másokat.",
      en: "May most wish to become invisible or not burden others."
    }
  },

  /* =========================
     121-250
  ========================= */

  ...(() => {
    const items = [];
    let num = 121;

    function makeId() {
      return `DEP_${String(num++).padStart(3, "0")}`;
    }

    function add(subdomain, weight, reverse, stemKey, hu, en) {
      items.push({
        id: makeId(),
        domain: "DEPRESSION",
        subdomain,
        weight,
        reverse,
        stemKey,
        text: { hu, en }
      });
    }

    const contexts = [
      { hu: "otthoni helyzetekben", en: "at home" },
      { hu: "iskolai vagy munkahelyi helyzetekben", en: "in school or work situations" },
      { hu: "társas helyzetekben", en: "in social situations" },
      { hu: "egyedül töltött időben", en: "when alone" },
      { hu: "a nap elején vagy a nap végén", en: "at the beginning or end of the day" }
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
      "low_mood",
      1.5,
      false,
      "persistent_sadness",
      "Tartós lehangoltság vagy szomorúság jelenhet meg",
      "Persistent low mood or sadness may be present"
    );

    contextualize(
      "low_mood",
      1.4,
      false,
      "emotional_heaviness",
      "A mindennapok érzelmileg nehezebbnek tűnhetnek",
      "Daily life may feel emotionally heavier"
    );

    contextualize(
      "low_mood",
      1.2,
      true,
      "mood_stability_reverse",
      "Képes viszonylag stabil maradni érzelmileg",
      "Can remain relatively emotionally stable"
    );

    contextualize(
      "low_mood",
      1.4,
      false,
      "lingering_sadness",
      "A rosszabb hangulat nehezen múlik el",
      "Low mood is slow to lift"
    );

    contextualize(
      "low_mood",
      1.3,
      false,
      "mood_drop_without_clear_reason",
      "Látható ok nélkül is lejjebb kerülhet a hangulata",
      "Mood may drop even without a visible reason"
    );

    contextualize(
      "anhedonia_interest_loss",
      1.5,
      false,
      "reduced_pleasure",
      "Kevésbé tud örömet találni azokban a dolgokban, amelyek korábban jólesetek",
      "Finds less pleasure in things that used to feel good"
    );

    contextualize(
      "anhedonia_interest_loss",
      1.4,
      false,
      "interest_loss",
      "Csökkenhet az érdeklődése olyan tevékenységek iránt, amelyek korábban fontosak voltak",
      "Interest may decrease in activities that were previously important"
    );

    contextualize(
      "anhedonia_interest_loss",
      1.2,
      true,
      "enjoyment_access_reverse",
      "Továbbra is képes örömöt vagy kíváncsiságot átélni",
      "Can still experience enjoyment or curiosity"
    );

    contextualize(
      "anhedonia_interest_loss",
      1.4,
      false,
      "motivation_for_fun_loss",
      "Nehéz kedvet kapnia még kellemes programokhoz is",
      "Has difficulty feeling motivated even for pleasant activities"
    );

    contextualize(
      "anhedonia_interest_loss",
      1.3,
      false,
      "positive_response_blunting",
      "A pozitív élmények kevésbé elevenítik fel érzelmileg",
      "Positive experiences feel less emotionally activating"
    );

    contextualize(
      "energy_fatigue",
      1.5,
      false,
      "low_energy",
      "Kevés energiát érez magában a hétköznapi feladatokhoz",
      "Feels low on energy for everyday tasks"
    );

    contextualize(
      "energy_fatigue",
      1.4,
      false,
      "effortful_daily_tasks",
      "A napi teendők a szokásosnál nagyobb erőfeszítést igényelhetnek",
      "Daily tasks may require more effort than usual"
    );

    contextualize(
      "energy_fatigue",
      1.2,
      true,
      "energy_access_reverse",
      "Többnyire képes mozgósítani magát a szükséges dolgokra",
      "Can usually mobilize enough energy for necessary things"
    );

    contextualize(
      "energy_fatigue",
      1.4,
      false,
      "fatigue_not_restored",
      "Pihenés után sem feltétlenül érzi magát igazán feltöltődve",
      "Does not necessarily feel restored even after rest"
    );

    contextualize(
      "energy_fatigue",
      1.3,
      false,
      "slow_starting",
      "Nehéz lehet számára belelendülni a napba vagy egy feladatba",
      "May find it hard to get started with the day or a task"
    );

    contextualize(
      "self_worth_guilt",
      1.5,
      false,
      "low_self_worth",
      "Kevésbé értékesnek vagy elég jónak láthatja önmagát",
      "May see self as less valuable or not good enough"
    );

    contextualize(
      "self_worth_guilt",
      1.4,
      false,
      "self_criticism",
      "Bántóan vagy túl szigorúan bánhat önmagával",
      "May treat self in an overly harsh or critical way"
    );

    contextualize(
      "self_worth_guilt",
      1.2,
      true,
      "self_acceptance_reverse",
      "Képes együttérzőbben viszonyulni önmagához",
      "Can relate to self with more compassion"
    );

    contextualize(
      "self_worth_guilt",
      1.4,
      false,
      "excessive_guilt",
      "A hibáit vagy hiányosságait túlzott súllyal élheti meg",
      "May experience faults or shortcomings with excessive weight"
    );

    contextualize(
      "self_worth_guilt",
      1.3,
      false,
      "worthlessness_theme",
      "Megjelenhet benne az értéktelenség érzése",
      "Feelings of worthlessness may appear"
    );

    contextualize(
      "hopelessness_future",
      1.5,
      false,
      "future_hopelessness",
      "A jövő kevésbé tűnhet reményteljesnek",
      "The future may feel less hopeful"
    );

    contextualize(
      "hopelessness_future",
      1.4,
      false,
      "nothing_will_change",
      "Úgy érezheti, hogy a helyzete nemigen fog javulni",
      "May feel that the situation is unlikely to improve"
    );

    contextualize(
      "hopelessness_future",
      1.2,
      true,
      "future_possibility_reverse",
      "Képes meglátni, hogy lehetnek még előtte jó irányok",
      "Can still see that good directions may exist ahead"
    );

    contextualize(
      "hopelessness_future",
      1.4,
      false,
      "future_effort_pointlessness",
      "Az erőfeszítés kevésbé tűnhet értelmesnek vagy megtérülőnek",
      "Effort may feel less meaningful or worthwhile"
    );

    contextualize(
      "hopelessness_future",
      1.3,
      false,
      "future_blankness",
      "A jövő üresebbnek vagy nehezebben elképzelhetőnek tűnhet",
      "The future may seem emptier or harder to imagine"
    );

    contextualize(
      "concentration_decision",
      1.4,
      false,
      "focus_difficulty",
      "Nehezebben tud huzamosabban figyelni",
      "Has more difficulty concentrating for longer periods"
    );

    contextualize(
      "concentration_decision",
      1.4,
      false,
      "decision_difficulty",
      "A döntéshozatal a szokásosnál megterhelőbb lehet",
      "Decision-making may feel more burdensome than usual"
    );

    contextualize(
      "concentration_decision",
      1.2,
      true,
      "clear_thinking_reverse",
      "Többnyire képes tisztán gondolkodni és mérlegelni",
      "Can usually think clearly and weigh things up"
    );

    contextualize(
      "concentration_decision",
      1.3,
      false,
      "mental_fog",
      "Gondolkodása ködösebbnek vagy lassabbnak tűnhet",
      "Thinking may feel foggier or slower"
    );

    contextualize(
      "concentration_decision",
      1.3,
      false,
      "small_decision_burden",
      "Még kisebb döntések is aránytalanul nehéznek tűnhetnek",
      "Even smaller decisions may feel disproportionately difficult"
    );

    contextualize(
      "sleep_change",
      1.4,
      false,
      "sleep_disturbance",
      "Alvása kevésbé pihentető vagy nyugodt lehet",
      "Sleep may be less restful or settled"
    );

    contextualize(
      "sleep_change",
      1.4,
      false,
      "nonrestorative_sleep",
      "Alvás után sem feltétlenül érzi magát kipihentnek",
      "May not feel rested even after sleep"
    );

    contextualize(
      "sleep_change",
      1.2,
      true,
      "restorative_sleep_reverse",
      "Alvása többnyire helyreállító és pihentető tud lenni",
      "Sleep is usually restorative and restful"
    );

    contextualize(
      "sleep_change",
      1.3,
      false,
      "morning_heaviness",
      "Ébredés után nehézkesebbnek vagy kimerültebbnek érezheti magát",
      "May feel heavier or more exhausted after waking"
    );

    contextualize(
      "sleep_change",
      1.3,
      false,
      "staying_in_bed",
      "Nehéz lehet számára felkelni vagy elindítani a napot",
      "May find it difficult to get up and start the day"
    );

    contextualize(
      "appetite_body_change",
      1.3,
      false,
      "appetite_reduction",
      "Étkezése vagy étvágya csökkenhet",
      "Appetite or eating may decrease"
    );

    contextualize(
      "appetite_body_change",
      1.3,
      false,
      "meal_skipping",
      "Könnyebben kihagyhat étkezéseket vagy eltolhatja őket",
      "May skip or delay meals more easily"
    );

    contextualize(
      "appetite_body_change",
      1.2,
      true,
      "appetite_stability_reverse",
      "Étkezése és alapvető testi ritmusa többnyire rendezett marad",
      "Eating and basic bodily rhythm usually remain fairly organized"
    );

    contextualize(
      "appetite_body_change",
      1.3,
      false,
      "body_heaviness",
      "Testileg nehézkesebbnek vagy terheltebbnek érezheti magát",
      "May feel physically heavier or more burdened"
    );

    contextualize(
      "appetite_body_change",
      1.3,
      false,
      "low_drive_for_meals",
      "Nehéz lehet energiát mozgósítania az étkezéshez vagy önellátáshoz",
      "May struggle to mobilize energy for meals or self-care"
    );

    contextualize(
      "withdrawal_isolation",
      1.4,
      false,
      "social_withdrawal",
      "Hajlamosabb lehet visszahúzódni másoktól",
      "May become more withdrawn from others"
    );

    contextualize(
      "withdrawal_isolation",
      1.4,
      false,
      "feeling_disconnected",
      "Mások mellett is távolinak vagy leváltnak érezheti magát",
      "May feel distant or disconnected even around others"
    );

    contextualize(
      "withdrawal_isolation",
      1.2,
      true,
      "connection_access_reverse",
      "Képes kapcsolódni másokhoz, ha támogatásra lenne szüksége",
      "Can connect with others when support is needed"
    );

    contextualize(
      "withdrawal_isolation",
      1.3,
      false,
      "reduced_contact",
      "Kevesebb kedve lehet keresni vagy fenntartani a kapcsolatot",
      "May have less desire to seek or maintain contact"
    );

    contextualize(
      "withdrawal_isolation",
      1.3,
      false,
      "social_effort_burden",
      "A társas jelenlét a szokásosnál fárasztóbbnak tűnhet",
      "Social presence may feel more tiring than usual"
    );

    contextualize(
      "psychomotor_change",
      1.3,
      false,
      "slowed_movement",
      "Mozdulatai vagy cselekvései lelassultabbnak tűnhetnek",
      "Movements or actions may seem slower"
    );

    contextualize(
      "psychomotor_change",
      1.3,
      false,
      "reduced_initiation",
      "Nehezebb lehet elkezdenie mozdulatokat, feladatokat vagy válaszokat",
      "May find it harder to initiate movements, tasks, or responses"
    );

    contextualize(
      "psychomotor_change",
      1.2,
      true,
      "natural_pace_reverse",
      "Mozgása és reakciói többnyire természetes tempóban maradnak",
      "Movement and reactions usually remain at a natural pace"
    );

    contextualize(
      "psychomotor_change",
      1.3,
      false,
      "low_drive_posture",
      "Testtartásán vagy jelenlétén is érződhet a csökkent hajtóerő",
      "Reduced drive may show in posture or general presence"
    );

    contextualize(
      "psychomotor_change",
      1.3,
      false,
      "hesitant_action",
      "Cselekvésében több habozás vagy megtorpanás jelenhet meg",
      "Action may involve more hesitation or stopping"
    );

    contextualize(
      "meaning_motivation",
      1.4,
      false,
      "loss_of_meaning",
      "Kevesebb értelmet vagy célt érezhet a mindennapi tevékenységekben",
      "May feel less meaning or purpose in everyday activities"
    );

    contextualize(
      "meaning_motivation",
      1.4,
      false,
      "why_bother_feeling",
      "Nehéz lehet számára belső okot találni az erőfeszítésre",
      "May find it hard to feel an inner reason to make the effort"
    );

    contextualize(
      "meaning_motivation",
      1.2,
      true,
      "purpose_access_reverse",
      "Továbbra is képes kapcsolódni ahhoz, ami fontos vagy értékes számára",
      "Can still connect with what feels important or valuable"
    );

    contextualize(
      "meaning_motivation",
      1.3,
      false,
      "reduced_drive",
      "A belső hajtóerő és lendület csökkenhet",
      "Inner drive and momentum may decrease"
    );

    contextualize(
      "meaning_motivation",
      1.3,
      false,
      "effort_without_reward",
      "Az erőfeszítés nem mindig kapcsolódik együtt a sikerélmény vagy elégedettség érzésével",
      "Effort may not feel connected to satisfaction or reward"
    );

    contextualize(
      "burdensomeness_dark_thoughts",
      1.4,
      false,
      "feeling_like_burden",
      "Tehernek érezheti magát mások számára",
      "May feel like a burden to others"
    );

    contextualize(
      "burdensomeness_dark_thoughts",
      1.4,
      false,
      "dark_inner_narrative",
      "Belső gondolatai sötétebbé vagy leértékelőbbé válhatnak",
      "Inner thoughts may become darker or more self-devaluing"
    );

    contextualize(
      "burdensomeness_dark_thoughts",
      1.2,
      true,
      "anchored_presence_reverse",
      "Képes kapcsolódni ahhoz, hogy jelenléte számít és értéke van",
      "Can connect with the sense that presence matters and has value"
    );

    contextualize(
      "burdensomeness_dark_thoughts",
      1.4,
      false,
      "disappearing_wish_passive",
      "Megjelenhet benne a vágy, hogy inkább eltűnne vagy kivonulna",
      "May feel a wish to disappear or withdraw"
    );

    contextualize(
      "burdensomeness_dark_thoughts",
      1.3,
      false,
      "withdraw_from_visibility",
      "Legszívesebben nem lenne szem előtt és nem terhelne másokat",
      "May most wish not to be visible or burdensome to others"
    );

    return items.slice(0, 130);
})()
];