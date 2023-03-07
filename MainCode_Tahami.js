// the following global variables are available:
// input: an object that represents the received wire envelope
// output: an object that can be used for emitting records
// logger: a slf4j logger

// input has two properties:
// input.emitterPid contains the emitterPid of the received envelope
// input.records is an immutable array that contains the received records

logger.info('emitter pid is {}', input.emitterPid)

var record = input.records[0] // get the first record, it is assumed it comes from a Timer

// input records are immutable
// the properties of a record are TypedValues
logger.info('timer value: {}', record.BLOOM.getValue()) // print the timer value
logger.info('timer value type: {}', record.BLOOM.getType()) // print the timer value type

for (var prop in record) {
  // it is possible to iterate over the properties of a record
  logger.info('{}: {}', prop, record[prop])
}

// it is possible to write some logic dependent on the value type
// The DataType enum variants are available as global variables
if (record.BLOOM.getType() === BOOLEAN) {
  logger.info('timer value type is long')
}

// the newWireRecord() function creates a new mutable wire record
var outRecord = newWireRecord()

// add some properties to the record
// the properties must be TypedValues
// the new<Type>Value() family of functions can be used for creating TypedValues
// these functions are the same available in the TypedValues Java class

outRecord.intTest = newIntegerValue(34)
outRecord.timer = record.BLOOM
outRecord.timerHalf = newLongValue(record.BLOOM.getValue() / 2)

// the newByteArray function can be used to create a byte array of a given size
var byteArray = newByteArray(4)
byteArray[0] = 1
byteArray[1] = 2
byteArray[2] = 0xaa
byteArray[3] = 0xbb

outRecord.byteArrayTest = newByteArrayValue(byteArray)

// add outRecord to the list of records to be emitted
output.add(outRecord)

// // the script context is retained across different
// // invocations for a single ScriptFilter
// // this allows stateful computations

// // create a persistent counter
// counter = typeof(counter) === 'undefined' ? 0 : counter
// counter++

// var shouldCounterOn
// var isTurnedOnIrrigation
// var counterPump = typeof(counterPump) === 'undefined' ? 0 : counterPump
// counterPump++

// if (shouldCounterOn) {
// 	if (counterPump < 5) {
// 		isTurnedOnIrrigation = true
// 	} else {
// 		isTurnedOnIrrigation = false
// 		shouldCounterOn = false
// 		counterPump = 0
// 	}
// } else {
// 	if (counterPump < 10) {
// 		isTurnedOnIrrigation = false
// 	} else {
// 		isTurnedOnIrrigation = true
// 		shouldCounterOn = true
// 		counterPump = 0
// 	}
// }
// logger.info('isTurnedOnIrrigation: {}  shouldCounterOn: {}  counterPump: {}', isTurnedOnIrrigation, shouldCounterOn, counterPump)
// // emit the counter value in a different WireRecord
// var counterRecord = newWireRecord()
// counterRecord.PUMP = newBooleanValue(isTurnedOnIrrigation)
// output.add(counterRecord)

// the script context is retained across different
// invocations for a single ScriptFilter
// this allows stateful computations

function irrigationTimeInFunctionOfHumidity (humidity) {
  if (humidity >= 90.0) {
    turnOnSecondsPump = 0
  } else if (humidity >= 51 && humidity < 90) {
    turnOnSecondsPump = 10
  } else if (humidity >= 0 && humidity < 51) {
    turnOnSecondsPump = 15
  }
}

function resetIrrigationValues () {
  gShouldCounterOn = false
  gIsTurnedOnIrrigation = false
  gCounterPump = 0
}

function resetIlluminationValues () {
  gIsTurnedOnLights = false
}

function getShouldTurnOnLights (
  isBloom,
  turnOnLightsBloom,
  turnOnLightsVegetation
) {
  var shouldTurnOn = false

  if (isBloom) {
    if (turnOnLightsBloom) {
      shouldTurnOn = true
    }
  } else {
    if (turnOnLightsVegetation) {
      shouldTurnOn = true
    }
  }

  return shouldTurnOn
}

function getShouldTurnOnIrrigation (
  isBloom,
  turnOnIrrigationBloom,
  turnOnIrrigationVegetation
) {
  var shouldTurnOn = false

  if (isBloom) {
    if (turnOnIrrigationBloom) {
      shouldTurnOn = true
    }
  } else {
    if (turnOnIrrigationVegetation) {
      shouldTurnOn = true
    }
  }

  return shouldTurnOn
}

function switchIrrigation (turnOffSeconds) {
  if (gShouldCounterOn) {
    if (gCounterPump < turnOnSecondsPump) {
      gIsTurnedOnIrrigation = true
    } else {
      resetIrrigationValues()
    }
  } else {
    if (gCounterPump < turnOffSeconds) {
      gIsTurnedOnIrrigation = false
    } else {
      gIsTurnedOnIrrigation = true
      gShouldCounterOn = true
      gCounterPump = 0
    }
  }
}

function isBefore (a, b) {
  return a <= b
}

function isAfter (a, b) {
  return a >= b
}

function isBetween (value, start, end) {
  return isAfter(value, start) && isBefore(value, end)
}

function updateValues () {
  var isBloom = !record.BLOOM.getValue()
  var isIrrigationForceOff = !record.TURN_OFF_IRRIGATION.getValue()
  var humidity = record.HUMIDITY.getValue() / 100

  var turnOffSeconds = isBloom
    ? TURN_OFF_SECONDS_BLOOM
    : TURN_OFF_SECONDS_VEGETATION

  var turnOnLightsVegetation =
    isBetween(
      gCurrentHour,
      STARTING_HOUR_MORNING_LIGHTS,
      FINISH_HOUR_MORNING_LIGHTS
    ) ||
    isBetween(
      gCurrentHour,
      STARTING_HOUR_AFTERNOON_LIGHTS,
      FINISH_HOUR_AFTERNOON_LIGHTS
    ) ||
    isBetween(
      gCurrentHour,
      STARTING_HOUR_EARLY_MORNING_LIGHTS,
      FINISH_HOUR_EARLY_MORNING_LIGHTS
    )
  var turnOnLightsBloom =
    isBetween(
      gCurrentHour,
      STARTING_HOUR_MORNING_LIGHTS,
      FINISH_HOUR_MORNING_LIGHTS
    ) ||
    isBetween(
      gCurrentHour,
      STARTING_HOUR_AFTERNOON_LIGHTS,
      FINISH_HOUR_AFTERNOON_LIGHTS_BLOOM
    )
  var turnOnIrrigationBloom = isBetween(
    gCurrentHour,
    STARTING_HOUR_MORNING_IRRIGATION_BLOOM,
    FINISH_HOUR_AFTERNOON_IRRIGATION_BLOOM
  )
  var turnOnIrrigationVegetation =
    isBetween(
      gCurrentHour,
      STARTING_HOUR_MORNING_IRRIGATION_VEGETATION,
      FINISH_HOUR_NIGHT_IRRIGATION_VEGETATION
    ) ||
    isBetween(
      gCurrentHour,
      STARTING_HOUR_EARLY_MORNING_IRRIGATION_VEGETATION,
      FINISH_HOUR_EARLY_MORNING_IRRIGATION_VEGETATION
    )
  var shouldTurnOn = getShouldTurnOnIrrigation(
    isBloom,
    turnOnIrrigationBloom,
    turnOnIrrigationVegetation
  )
  var shouldTurnLightsOn = getShouldTurnOnLights(
    isBloom,
    turnOnLightsBloom,
    turnOnLightsVegetation
  )
  var shouldTurnOnIrrigation = shouldTurnOn && isIrrigationForceOff
  // Lights
  if (shouldTurnLightsOn) {
    gIsTurnedOnLights = true
  } else {
    resetIlluminationValues()
  }
  //Irrigation On Times
  irrigationTimeInFunctionOfHumidity(humidity)
  // Irrigation
  if (shouldTurnOnIrrigation) {
    switchIrrigation(turnOffSeconds)
  } else {
    resetIrrigationValues()
  }
}

/** START: Configurations +*/
// https://www.epochconverter.com/
// Friday, 16 September 2022 5:00:00 AM - UTC
// Thursday, 15 September 2022 12:00:00 AM GMT-05:00 - Colombian Time
var STARTING_HOUR_MORNING_LIGHTS = 11
var FINISH_HOUR_MORNING_LIGHTS = 14
var STARTING_HOUR_AFTERNOON_LIGHTS = 20
var FINISH_HOUR_AFTERNOON_LIGHTS = 23
var FINISH_HOUR_AFTERNOON_LIGHTS_BLOOM = 22
var STARTING_HOUR_EARLY_MORNING_LIGHTS = 0
var FINISH_HOUR_EARLY_MORNING_LIGHTS = 4
var STARTING_HOUR_MORNING_IRRIGATION_VEGETATION = 11
var STARTING_HOUR_MORNING_IRRIGATION_BLOOM = 15
var FINISH_HOUR_AFTERNOON_IRRIGATION_BLOOM = 20
var FINISH_HOUR_NIGHT_IRRIGATION_VEGETATION = 23
var STARTING_HOUR_EARLY_MORNING_IRRIGATION_VEGETATION = 0
var FINISH_HOUR_EARLY_MORNING_IRRIGATION_VEGETATION = 4
var turnOnSecondsPump
var TURN_OFF_SECONDS_VEGETATION = 30 * 60
var TURN_OFF_SECONDS_BLOOM = 20 * 60
var TIME_OFFSET = -5 // Colombia GTM -5
/** END: Configurations +*/

// create a persistent counter
counter = typeof counter === 'undefined' ? 0 : counter
counter++

var gCounterPump = typeof gCounterPump === 'undefined' ? 0 : gCounterPump
gCounterPump++

var gShouldCounterOn 
var gIsTurnedOnIrrigation = false
var gIsTurnedOnLights = false
var gNow = new Date()
var gCurrentHour = gNow.getHours()

updateValues()

logger.info(
  'Hours: {}  isTurnedOnIrrigation: {}  isTurnedOnLights: {}  shouldCounterOn: {}  counterPump: {}',
  gCurrentHour,
  gIsTurnedOnIrrigation,
  gIsTurnedOnLights,
  gShouldCounterOn,
  gCounterPump
)

logger.info(
  'bloom:{}, irrigation: {}, Humidity: {},',
  !record.BLOOM.getValue(),
  !record.TURN_OFF_IRRIGATION.getValue(),
  record.HUMIDITY.getValue() / 100
)

// emit the counter value in a different WireRecord
var counterRecord = newWireRecord()
counterRecord.PUMP = newBooleanValue(gIsTurnedOnIrrigation)
counterRecord.LIGHTS = newBooleanValue(gIsTurnedOnLights)
output.add(counterRecord)
