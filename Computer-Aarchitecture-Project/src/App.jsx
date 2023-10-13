import React, { useState, useRef, useEffect } from 'react';
import './styles.css';
import { HiPlayCircle } from 'react-icons/hi2';
import { RiAddCircleFill } from 'react-icons/ri';
import { BsWrenchAdjustableCircleFill } from 'react-icons/bs';
import { GoXCircleFill, GoCheckCircleFill } from 'react-icons/go';
import { IoIosRemoveCircle } from 'react-icons/io';


// basic computer assembler with microPrograms control 
const makeBinary8Bit = (num) => {
  num = parseInt(num)
  let binary = num.toString(2);
  if (binary.length < 8) {
    binary = '0'.repeat(8 - binary.length) + binary;
  }
  return binary;
};

const makeBinary7Bit = (num) => {
  num = parseInt(num)
  let binary = num.toString(2);
  if (binary.length < 7) {
    binary = '0'.repeat(7 - binary.length) + binary;
  }
  return binary;
};

const makeBinary4Bit = (num) => {
  num = parseInt(num)
  let binary = num.toString(2);
  if (binary.length < 4) {
    binary = '0'.repeat(4 - binary.length) + binary;
  }
  return binary;
};

const makeBinaryNBit = (num, n) => {
  num = parseInt(num)
  let binary = num.toString(2);
  if (binary.length < n) {
    binary = '0'.repeat(n - binary.length) + binary;
  }
  return binary;
};


const findCodeFromName = (name, array) => {
  if (name) {
    const code = array.find((item) => item.name === name);
    return code;
  }
};


const makeHex = (num, base) => {
  num = parseInt(num, base)
  let hex = num.toString(16);
    hex = '0x' + hex;
  return hex;
};


const decodeVarsValue = (type, number) => {
  if (type === 'DEC') {
    return makeBinaryNBit(number, 16);
  } else if (type === 'HEX') {
    const num = parseInt(number, 16);
    return makeBinaryNBit(num, 16);
  }
};


function formatString(inputString, lengths) {
  if (inputString) {
    const groupLengths = lengths; // Lengths of each group
    let formattedString = "";
    let currentIndex = 0;

    // Iterate over each group length
    for (const length of groupLengths) {
      const group = inputString.substr(currentIndex, length); // Extract the current group
      formattedString += group + "-"; // Append the group to the formatted string
      currentIndex += length; // Move the current index forward
    }

    // Remove the trailing dash
    formattedString = formattedString.slice(0, -1);

    return formattedString;
  }
  else {
    return ''
  }
}


const MiniComputer = () => {
  const memoryLengthGroup = [1, 4, 11];
  const contrlMemoryLengthGroup = [3, 3, 3, 2, 2, 7];
  const enteredCode = useRef(null);
  const controlCode = useRef(null);
  const [output, _] = useState(null);
  const [memory, setMemory] = useState([]);
  const [controlMemory, setControlMemory] = useState([]);
  const [accumulator, setAccumulator] = useState("0");
  const [programCounter, setProgramCounter] = useState("0");
  const [addressRegister, setAddressRegister] = useState("0");
  const [dataRegister, setDataRegister] = useState("0");
  const [CAR, setCAR] = useState("1000000");
  const [SBR, setSBR] = useState("0");
  const [isRunning, setIsRunning] = useState(false);
  const [isEditable ,setIsEditable] = useState(true);
  const [automatedTimeout, setAutomatedTimeout] = useState(0)
  const [fetchAddress, setFetchAddress] = useState("1000000");
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isAddedTomemory, setIsAddedTomemory] = useState(false);


  const BR_JMP = (cndt, code) => {
    if (cndt) {
      setCAR(code); // CHECK THIS PLACE
    } else {
      setCAR(prvCAR => {
        const decimalPrvCAR = parseInt(prvCAR, 2);
        return makeBinaryNBit(decimalPrvCAR + 1, 7);
      });
    }
  }

  const BR_CALL = (cndt, code) => {
    if (cndt) {
      setSBR(
          () => {
            const decimalPrvCAR = parseInt(CAR, 2);
            return makeBinaryNBit(decimalPrvCAR + 1, 7);
          }
      );
      setCAR(code);
    } else {
      setCAR(prvCAR => {
        const decimalPrvCAR = parseInt(prvCAR, 2);
        return makeBinaryNBit(decimalPrvCAR + 1, 7);
      });
    }
  }


  const BR_RET = () => {
    setCAR(SBR);
  }


  const BR_MAP = () => {
    let newCAR = dataRegister.slice(1, 5);
    newCAR = '0' + newCAR + '00';
    setCAR(newCAR);
  }


  const CD_I = () => {
    return dataRegister[0] == '1';
  }

  const CD_S = () => {
    return accumulator[0] == '1';
  }

  const CD_Z = () => {
    return parseInt(accumulator) == 0;
  }

  // @@@@@@@@@@@@@@@@@@@@ FUNCTIONALITY FOR Micro Operations @@@@@@@@@@@@@@@@@@@@@@

  const F1_ADD = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const decimalDataRegister = parseInt(dataRegister, 2);
      const result = decimalDataRegister + prvAccumulator;
      return makeBinaryNBit(result, 16);
    });
  }

  const F1_CLRAC = () => {
    setAccumulator('0000000000000000');
  }

  const F1_INCAC = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const result = prvAccumulator + 1;
      return makeBinaryNBit(result, 16);
    });
  }

  const F1_DRTAC = () => {
    setAccumulator(dataRegister);
  }

  const F1_DRTAR = () => {
      if (dataRegister.slice(5, 16) === "11111111111") {
        setIsRunning(false);
        return;
      }
      setAddressRegister(dataRegister.slice(5, 16));
  }

  const F1_PCTAR = () => {
    setAddressRegister(programCounter);
  }

  const F1_WRITE = () => {
    const copyOfMemory = {...memory};
    const decimalAddressRegister = parseInt(addressRegister, 2);
    const decimalDataRegister = parseInt(dataRegister, 2);
    copyOfMemory[decimalAddressRegister].content = makeBinaryNBit(decimalDataRegister, 16); // INJA RO SHAK DARAM
    setMemory(copyOfMemory);
  }

  const F2_SUB = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const decimalDataRegister = parseInt(dataRegister, 2);
      const result = prvAccumulator - decimalDataRegister;
      return makeBinaryNBit(result, 16);
    });
  }

  const F2_OR = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const decimalDataRegister = parseInt(dataRegister, 2);
      const result = prvAccumulator | decimalDataRegister;
      return makeBinaryNBit(result, 16);
    });
  }

  const F2_AND = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const decimalDataRegister = parseInt(dataRegister, 2);
      const result = prvAccumulator & decimalDataRegister;
      return makeBinaryNBit(result, 16);
    });
  }

  const F2_READ = () => {
    setDataRegister(prvDataRegister => {
      const decimalAddressRegister = parseInt(addressRegister, 2);
      const result = memory[decimalAddressRegister].content;
      return result;
    });
  }

  const F2_ACTDR = () => {
    setDataRegister(accumulator);
  }

  const F2_INCDR = () => {
    setDataRegister(prvDataRegister => {
      prvDataRegister = parseInt(prvDataRegister, 2);
      const result = prvDataRegister + 1;
      return makeBinaryNBit(result, 16);
    });
  }

  const F2_PCTDR = () => {
    if (programCounter.length !== 11)
      console.log("YECHIZI INJA GHALATE");
    setDataRegister(programCounter);
  }


  const F3_XOR = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const decimalDataRegister = parseInt(dataRegister, 2);
      const result = prvAccumulator ^ decimalDataRegister;
      return makeBinary8Bit(result);
    });
  }

  const F3_COM = () => {
    setAccumulator(prvAccumulator => {
      let myStr = '';
      for (let i = 0; i < prvAccumulator.length; i++) {
        if (prvAccumulator[i] === '0')
          myStr += '1';
        else
          myStr += '0';
      }
      return myStr;
    });
  }

  const F3_SHL = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const result = prvAccumulator << 1;
      return makeBinary8Bit(result);
    });
  }

  const F3_SHR = () => {
    setAccumulator(prvAccumulator => {
      prvAccumulator = parseInt(prvAccumulator, 2);
      const result = prvAccumulator >> 1;
      return makeBinary8Bit(result);
    });
  }

  const F3_INCPC = () => {
    setProgramCounter(prvProgramCounter => {
      prvProgramCounter = parseInt(prvProgramCounter, 2);
      const result = prvProgramCounter + 1;
      return makeBinaryNBit(result, 11);
    });
  }

  const F3_ARTPC = () => {
    setProgramCounter(addressRegister);
  }


  const F1 = [
    {
      name: 'NOP', code: '000', action: () => {
      }
    },
    {name: 'ADD', code: '001', action: F1_ADD},
    {name: 'CLRAC', code: '010', action: F1_CLRAC},
    {name: 'INCAC', code: '011', action: F1_INCAC},
    {name: 'DRTAC', code: '100', action: F1_DRTAC},
    {name: 'DRTAR', code: '101', action: F1_DRTAR},
    {name: 'PCTAR', code: '110', action: F1_PCTAR},
    {name: 'WRITE', code: '111', action: F1_WRITE},
  ]
  const F2 = [
    {
      name: 'NOP', code: '000', action: () => {
      }
    },
    {name: 'SUB', code: '001', action: F2_SUB},
    {name: 'OR', code: '010', action: F2_OR},
    {name: 'AND', code: '011', action: F2_AND},
    {name: 'READ', code: '100', action: F2_READ},
    {name: 'ACTDR', code: '101', action: F2_ACTDR},
    {name: 'INCDR', code: '110', action: F2_INCDR},
    {name: 'PCTDR', code: '111', action: F2_PCTDR},
  ]

  const F3 = [
    {
      name: 'NOP', code: '000', action: () => {
      }
    },
    {name: 'XOR', code: '001', action: F3_XOR},
    {name: 'COM', code: '010', action: F3_COM},
    {name: 'SHL', code: '011', action: F3_SHL},
    {name: 'SHR', code: '100', action: F3_SHR},
    {name: 'INCPC', code: '101', action: F3_INCPC},
    {name: 'ARTPC', code: '110', action: F3_ARTPC},
    {
      name: 'RESERVED', code: '111', action: () => {
      }
    },
  ]

  const merged_Fs = [
    {
      name: 'NOP', code: '000', action: () => {
      }, F: 1
    },
    {name: 'ADD', code: '001', action: F1_ADD, F: 1},
    {name: 'CLRAC', code: '010', action: F1_CLRAC, F: 1},
    {name: 'INCAC', code: '011', action: F1_INCAC, F: 1},
    {name: 'DRTAC', code: '100', action: F1_DRTAC, F: 1},
    {name: 'DRTAR', code: '101', action: F1_DRTAR, F: 1},
    {name: 'PCTAR', code: '110', action: F1_PCTAR, F: 1},
    {name: 'WRITE', code: '111', action: F1_WRITE, F: 1},
    {
      name: 'NOP', code: '000', action: () => {
      }, F: 2
    },
    {name: 'SUB', code: '001', action: F2_SUB, F: 2},
    {name: 'OR', code: '010', action: F2_OR, F: 2},
    {name: 'AND', code: '011', action: F2_AND, F: 2},
    {name: 'READ', code: '100', action: F2_READ, F: 2},
    {name: 'ACTDR', code: '101', action: F2_ACTDR, F: 2},
    {name: 'INCDR', code: '110', action: F2_INCDR, F: 2},
    {name: 'PCTDR', code: '111', action: F2_PCTDR, F: 2},
    {
      name: 'NOP', code: '000', action: () => {
      }, F: 3
    },
    {name: 'XOR', code: '001', action: F3_XOR, F: 3},
    {name: 'COM', code: '010', action: F3_COM, F: 3},
    {name: 'SHL', code: '011', action: F3_SHL, F: 3},
    {name: 'SHR', code: '100', action: F3_SHR, F: 3},
    {name: 'INCPC', code: '101', action: F3_INCPC, F: 3},
    {name: 'ARTPC', code: '110', action: F3_ARTPC, F: 3},
    {
      name: 'RESERVED', code: '111', action: () => {
      }, F: 3
    },
  ]

  const all_CD = [
    {
      name: "U", code: "00", action: () => {
        return true
      }
    },
    {name: "I", code: "01", action: CD_I},
    {name: "S", code: "10", action: CD_S},
    {name: "Z", code: "11", action: CD_Z},
  ]

  const all_BR = [
    {name: "JMP", code: "00", action: (cndt, code) => BR_JMP(cndt, code)},
    {name: "CALL", code: "01", action: (cndt, code) => BR_CALL(cndt, code)},
    {name: "RET", code: "10", action: (cndt) => BR_RET(cndt)},
    {name: "MAP", code: "11", action: (cndt) => BR_MAP(cndt)},
  ]

  const CD = [
    {name: "U", code: "00"},
    {name: "I", code: "01"},
    {name: "S", code: "10"},
    {name: "Z", code: "11"},
  ]

  const BRANCH = [
    {name: "JMP", code: "00"},
    {name: "CALL", code: "01"},
    {name: "RET", code: "10"},
    {name: "MAP", code: "11"},
  ]


  // fill memory at first initialization with null values
  useEffect(() => {
    setMemory((prev) => {
      const newMemory = {...prev};
      for (let i = 0; i < 2048; i++) {
        newMemory[i] = {
          address: '',
          instruction: '',
          label: '',
        };
      }
      return newMemory;
    });
  }, []);

  useEffect(() => {
    setControlMemory((prev) => {
      const newControlMemory = {...prev};
      for (let i = 0; i < 128; i++) {
        newControlMemory[i] = {
          address: '',
          instruction: '',
          label: '',
        };
      }
      return newControlMemory;
    });
  }, []);


// code compiles here
  useEffect( () => {
    setTimeout(() => {
      if (isRunning && !isDebugMode) {
        let conditionIsHappened = false;
        const shouldRunLine = controlMemory[parseInt(CAR, 2)].content;
        const [F1, F2, F3, CD, BR, nextLineAddr] = formatString(shouldRunLine, contrlMemoryLengthGroup).split('-');
        merged_Fs.map((elem) => {
          if ((elem.code === F1 && elem.F === 1) || (elem.code === F2 && elem.F === 2) || (elem.code === F3 && elem.F === 3)) {
            elem.action();
          }
        })
        all_CD.map((elem) => {
          if (elem.code === CD) {
            conditionIsHappened = elem.action();
          }
        })

        all_BR.map((elem) => {
          if (elem.code === BR && (elem.name === 'CALL' || elem.name === "JMP")) {
            elem.action(conditionIsHappened, nextLineAddr);
          } else if (elem.code === BR) {
            elem.action();
          }
        })
      }
    }, automatedTimeout)

  },[CAR, isRunning])


  const controlTextSubmitted = () => {
    const controlText = controlCode.current.value;
    const controlLines = controlText.split('\n');
    let firstF1;
    let firstF2;
    let firstF3;
    let addressNumberInMemory = 0;
    let labelAdr = 0;
    const updateArray = []; // temp control memory
    const labelAddresses = []; // labels with their addresses save here

    // asign labels with their addresses
    controlLines.map((line) => {
      const [ORG, NUMBER] = line.replace(/\s+/g, ' ').split(' ');
      if (ORG === "ORG") {
        labelAdr = parseInt(NUMBER);
      } else {
        const label = line.includes(':') ? line.split(':')[0].trim() : undefined;
          if (label !== undefined) {
            labelAddresses.push({label: label, labelAdr: labelAdr});
          }
          if (label === "FETCH") {
            // console.log("SALAM", labelAdr);
            setCAR(makeBinaryNBit(labelAdr, 7));
            setFetchAddress(makeBinaryNBit(labelAdr, 7));
          }
        labelAdr++;
      }
    })



    controlLines.map((line) => {
      firstF1 = "000";
      firstF2 = "000";
      firstF3 = "000";
      let theBR = 0;
      let theCD = 0;
      let theAddress = 0;
      const [label, otherPartOfLine] = line.includes(':') ? [line.split(':')[0].trim(), line.split(':')[1].trim()] : [undefined, line.trim()];
      const [instruction, cd, br, address] = otherPartOfLine.split(' ');
      if (instruction === 'ORG') {
        addressNumberInMemory = parseInt(cd)
      } else if (instruction === 'END') {
        // STH MUST BE HERE BUT NOT IMPORTANT FOR NOW
      } else {
        theBR = findCodeFromName(br, BRANCH).code;
        theCD = findCodeFromName(cd, CD).code;
        if (address === "NEXT") {
          theAddress = addressNumberInMemory + 1;
        } else if (address === undefined) {
          theAddress = 0;
        } else {
          theAddress = labelAddresses.find((elem) => elem.label === address).labelAdr;
        }

        instruction.split(',').map((elem, index) => {
          const theF = findCodeFromName(elem, merged_Fs);
          if (theF.F === 1) {
            firstF1 = theF.code;
          } else if (theF.F === 2) {
            firstF2 = theF.code;
          } else if (theF.F === 3) {
            firstF3 = theF.code;
          }
        });
        updateArray.push({
          F1: firstF1,
          F2: firstF2,
          F3: firstF3,
          theCD: theCD,
          theBR: theBR,
          addr: addressNumberInMemory,
          label: label,
          nextLineAddr: makeBinary7Bit(theAddress)
        });
        addressNumberInMemory++;
      }
    });
    const newCntrlMemory = {...controlMemory};
    updateArray.map((elem) => {
      newCntrlMemory[elem.addr] = {
        content: elem.F1 + elem.F2 + elem.F3 + elem.theCD + elem.theBR + elem.nextLineAddr,
        hexContent: makeHex(elem.F1 + elem.F2 + elem.F3 + elem.theCD + elem.theBR + elem.nextLineAddr, 2),
        label: elem.label,
        instruction: "",
      }
    })
    setControlMemory(newCntrlMemory);
  }

  // run only when add code button clicked
  const addCodeToMemory = () => {
    const codeText = enteredCode.current.value;
    const codeTextLines = codeText.split('\n'); // split code text into lines
    const variables = []; // all labels mapped to their addresses in this Array
    const contentList = []; // each memory line data adds to this array

    let memoryAddressNumber = 0; // this address use for writing each line 
    let addressNumberLables = 0; // this address use for writing each label


    // this map is for fetch & save all labels and their addresses
    codeTextLines.map((line) => {
      const fetchedLine = line.replace(/\s+/g, ' ').split(' '); // remove extra spaces and split line into words

      // checks if we fetching the line that contains ORG
      if (fetchedLine[0] === 'ORG') {
        addressNumberLables = parseInt(fetchedLine[1], 16); // set the address number to the value after ORG
      }

      // if sth like "DEC 10" or "HEX 0A" fetched
      else if (fetchedLine[0] === 'HEX' || fetchedLine[0] === 'DEC') {
        variables.push({
          label: "",
          address: addressNumberLables,
          value: decodeVarsValue(fetchedLine[0], fetchedLine[1])
        });
        addressNumberLables++;
      }

      // if its an instruction
      else {
        const fetchedLine = line.replace(/\s+/g, ' ').split(', '); // remove extra spaces and split line into words
        const label = fetchedLine.length > 1 ? fetchedLine[0] : undefined; // if the line contains label, set the label to the first word
        const AllTextExcludedLabel = fetchedLine.length > 1 ? fetchedLine[1] : fetchedLine[0];
        if (label !== undefined) { // we got a line that has a label and we have to save this address
          const decodeLine = AllTextExcludedLabel.split(' ');
          variables.push({
            label: label,
            address: addressNumberLables,
            value: decodeVarsValue(decodeLine[0], decodeLine[1])
          });
        }
        addressNumberLables++; // we put it here because we want to increase write address only when fetch line thats not a ORG
      }
    })

    // this map is for decode entered code and save it in main memory => second level of compiling
    codeTextLines.map((line) => {
          const fetchedLine = line.replace(/\s+/g, ' ');
          const [label, instructions] = fetchedLine.includes(",") ? [fetchedLine.split(',')[0].trim(), fetchedLine.split(',')[1].trim()] : [undefined, fetchedLine];
          if (label === undefined) {
            const [instruction, varAddress, isIndrct] = instructions.split(' '); // extract instruction, variable address and isIndrct from line
            if (instruction === 'ORG') {
              memoryAddressNumber = parseInt(varAddress, 16); // this carAddress is the number in ORG, because we get sth like "ORG 500"
            }
            else if (instruction === 'HLT') {
                const contentObject = {}
                contentObject['instruction'] = "1111"; // instruction number in control memory
                contentObject['addr'] = "11111111111"; // find second parameter address in variables array
                contentObject['indrct'] = "1"; // set indirect bit
                contentObject['addressInMemory'] = memoryAddressNumber;
                contentList.push(contentObject);
            }
            else {
              if (varAddress) { // if instruction has second parameter (variable address)
                const contentObject = {}
                for (let i = 0; i < 127; i++) {
                  if (controlMemory[i].label === instruction) {
                    contentObject['instruction'] = makeBinary4Bit(i / 4); // instruction number in control memory
                    contentObject['addr'] = makeBinaryNBit(variables.find((elem) => elem.label === varAddress).address, 11); // find second parameter address in variables array
                    contentObject['indrct'] = isIndrct === 'I' ? '1' : '0'; // set indirect bit
                    contentObject['addressInMemory'] = memoryAddressNumber;
                    contentList.push(contentObject);
                    break;
                  }
                }
              } else { // if instruction is just one command
                const contentObject = {}
                for (let i = 0; i < 127; i++) {
                  if (controlMemory[i].label === instruction) {
                    contentObject['instruction'] = makeBinary4Bit(i / 4);
                    contentObject['addr'] = makeBinaryNBit(0, 11); // because we doesnt have second parameter, we set address part to 0
                    contentObject['indrct'] = '0';
                    contentObject['addressInMemory'] = memoryAddressNumber;
                    contentList.push(contentObject);
                    break;
                  }
                }
              }
              memoryAddressNumber++;
            }
          }
        }
    )
    const newMemory = {...memory};
    contentList.map((elem) => { // add all content (non-variables) to temp-memory
          newMemory[elem.addressInMemory] = {
            content: elem.indrct + elem.instruction + elem.addr,
            hexContent: makeHex(elem.indrct + elem.instruction + elem.addr, 2),
            label: "",
            instruction: "",
          }
        }
    )
    variables.map((elem) => { // add all variables to temp-memory
          newMemory[elem.address] = {
            content: elem.value,
            hexContent: "",
            label: elem.label,
            instruction: "",
          }
        }
    )
    setIsAddedTomemory(true); // after changing this state
    setMemory(newMemory); // assign temp memory values to main memory
  }

  
  const compileCode = () => {
    if (!isAddedTomemory) {
      return;
    }
    setIsRunning(true); // after changing this state, compilation useEffect will run
  }


  const disableEdit = () => {
    setIsEditable((prv) => !prv);
  }

  const timeoutChanged = (e) => {
    setAutomatedTimeout(e.target.value)
  }

  const cleanUpAllRegisters = () => {
    setMemory((prev) => {
      const newMemory = {...prev};
      for (let i = 0; i < 2048; i++) {
        newMemory[i] = {
          address: '',
          instruction: '',
          label: '',
        };
      }
      return newMemory;
    });
    setCAR(fetchAddress)
    setAccumulator('0');
    setProgramCounter('0');
    setAddressRegister('0');
    setDataRegister('0');
    setSBR('0')
    setIsRunning(false);
    setIsDebugMode(false);
    setIsAddedTomemory(false);
  }

  const debugRunner = () => {
    if (!isAddedTomemory) {
      return;
    }
    setIsDebugMode(true);
    let conditionIsHappened = false;
    const shouldRunLine = controlMemory[parseInt(CAR, 2)].content;
    const [F1, F2, F3, CD, BR, nextLineAddr] = formatString(shouldRunLine, contrlMemoryLengthGroup).split('-');
    merged_Fs.map((elem) => {
      if ((elem.code === F1 && elem.F === 1) || (elem.code === F2 && elem.F === 2) || (elem.code === F3 && elem.F === 3)) {
        elem.action();
      }
    })
    all_CD.map((elem) => {
      if (elem.code === CD) {
        conditionIsHappened = elem.action();
      }
    })

    all_BR.map((elem) => {
      if (elem.code === BR && (elem.name === 'CALL' || elem.name === "JMP")) {
        elem.action(conditionIsHappened, nextLineAddr);
      } else if (elem.code === BR) {
        elem.action();
      }
    })
}

  return (
    <div className='container'>
      <div className='textAreas'>
        <div className='input-sides'>
          <h1>محیط برنامه‌نویسی</h1>
          <div className='singleTextAreaDiv'>
            <textarea className='controlStyle' ref={enteredCode}></textarea>
            <span><RiAddCircleFill onClick={addCodeToMemory} className='AddButton'/></span>
            <span><HiPlayCircle style={!isAddedTomemory && {"color":"rgb(160, 160, 160)", "cursor":"not-allowed"} } onClick={compileCode} className='PlayButton'/></span>
            <span><BsWrenchAdjustableCircleFill style={!isAddedTomemory && {"color":"rgb(160, 160, 160)", "cursor":"not-allowed"}} onClick={debugRunner} className='DebugButton'/></span>
            <span><IoIosRemoveCircle onClick={cleanUpAllRegisters} className='CleanUp'/></span>
            <input onChange={timeoutChanged} value={automatedTimeout} placeholder='زمان اجرای خودکار'></input>
          </div>
        </div>
        <div className='input-sides'>
          <h1>کد میکروپروگرام</h1>
          <div className='singleTextAreaDiv'>
            <textarea readOnly={isEditable === true ? "" : "true"} className='controlStyle' ref={controlCode}></textarea>
            <span><RiAddCircleFill onClick={controlTextSubmitted} className='AddButton'/></span>
            <span>{isEditable === true ? <GoXCircleFill onClick={disableEdit} className='LockButton'/> : <GoCheckCircleFill onClick={disableEdit} className='LockButton'/>}</span>
          </div>
        </div>
      </div>
      <div className='memory-tables'>
      <div className='table-all'>
      <div>حافظه میکروپروگرام</div>
      <table className='styled-table'>
        <thead>
          <tr style={{"margin":"10px"}}>
            <th style={{"width":"10%"}}>Address</th>
            <th style={{"width":"20%"}}>Hex Address</th>
            <th style={{"width":"10%"}}>Label</th>
            <th style={{"width":"40%"}}>Content</th>
            <th style={{"width":"15%"}}>Hex Content</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(controlMemory).map((key) => {
            return (
              <tr key={key}>
                <td style={{"width":"10%"}}>{key}</td>
                <td style={{"width":"20%"}}>{makeHex(key, 10)}</td>
                <td style={{"width":"10%"}}>{controlMemory[key].label}</td>
                <td style={{"width":"40%"}}>{formatString(controlMemory[key].content, [3, 3, 3, 2, 2, 7])}</td>
                <td style={{"width":"15%"}}>{controlMemory[key].hexContent}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div className='table-all'>
      <div>حافظه اصلی برنامه</div>
        <table className='styled-table'>
          <thead>
            <tr style={{"margin":"10px"}}>
              <th style={{"width":"10%"}}>Address</th>
              <th style={{"width":"20%"}}>Hex Address</th>
              <th style={{"width":"10%"}}>label</th>
              <th style={{"width":"40%"}}>Content</th>
              <th style={{"width":"15%"}}>Hex Content</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(memory).map((key) => {
              return (
                <tr key={key}>
                  <td style={{"width":"10%"}}>{key}</td>
                  <td style={{"width":"20%"}}>{makeHex(key, 10)}</td>
                  <td style={{"width":"10%"}}>{memory[key].label}</td>
                  <td style={{"width":"40%"}}>{formatString(memory[key].content, [1, 4, 11])}</td>
                  <td style={{"width":"15%"}}>{memory[key].hexContent}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <div className='table-all registerTable'>
        <div>رجیسترها</div>
        <table className='styled-table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Acomulator</td>
              <td>{accumulator}</td>
            </tr>
            <tr>
              <td>Control AR</td>  
              <td>{CAR}</td>
            </tr>
            <tr>
              <td>Address Register</td>
              <td>{addressRegister}</td>
            </tr>
            <tr>
              <td>Program Counter</td>
              <td>{programCounter}</td>
            </tr>
            <tr>
              <td>Data Register</td>
              <td>{dataRegister}</td>
            </tr>
            <tr>
              <td>Control SBR</td>
              <td>{SBR}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
export default MiniComputer;
