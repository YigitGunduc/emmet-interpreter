const fs = require("fs");

let vars = {};

digitRegex = /^[0-9]+/
letterRegex = /^[A-Za-z]+/

// base state
const base_state = {
  input: '',
  result: '',
  startsAt: 0,
  endsAt: 0,
  length: 0,
  error: null,
  isError: false
}

const generateState = _input => {
  return { 
  input: _input,
  result: '',
  startsAt: 0,
  endsAt: 0,
  length: 0,
  error: null,
  isError: false 
  }
}

class Parser {
  constructor() {}

  parse(){}

  apply(state, fn) {
    let newState = this.parse(state);
    return {
      ...state,
      result: fn(newState.result)
    }
  }
}

class StringParser extends Parser{
  constructor(target, type) {
    super();
    this.type = type;
    this.target = target;
  }

  parse(state) {
    let { input, endsAt } = state;

    if(input.length === 0) {
      return {
        ...state,
        isError: true,
        error: 'StringParser expected input but got empyt string instead'
      };
    }

    if(input.slice(endsAt).startsWith(this.target)) {
      return {
        ...state,
        startsAt: endsAt,
        endsAt: endsAt + this.target.length,
        length: this.target.length,
        result: {
          res: this.target,
          type: this.type
        }
      }
    } else {
      return {
        ...state,
        error: 'StringParser could not match with input',
        isError: true
      };
    }
  }
}

class DigitParser extends Parser{
  constructor() {
    super();
  }

  parse(state) {
    let { input, endsAt } = state;

    if(digitRegex.test(input.slice(endsAt))) {
      let res = input.slice(endsAt).match(digitRegex)[0]
      return {
        ...state,
        startsAt: endsAt,
        endsAt: endsAt + res.length,
        length: res.length,
        result: {
          res: res,
          type: 'digit',
          value: Number(res)
        }
      };
    } else {
      return {
        ...state,
        error: 'DigitParser could not match any input',
        isError: true
      };
    }
  }
}

class LetterParser extends Parser{
  constructor(type) {
    super();
    this.type = type;
  }

  parse(state) {
    let { input, endsAt } = state;

    if(input.length === 0) {
      return {
        ...state,
        isError: true,
        error: 'LetterParser expected input but got empyt string instead'
      };
    }

    if(letterRegex.test(input.slice(endsAt))) {
      let res = input.slice(endsAt).match(letterRegex)[0]
      return {
        ...state,
        startsAt: endsAt,
        endsAt: endsAt + res.length,
        length: res.length,
        result: {
          res: res,
          type: this.type
        }
      };
    } else {
      return {
        ...state,
        error: 'LetterParser could not match any input', isError: true };
    }
  }
}


class AnyParser extends Parser{
  constructor(parsers) {
    super();
    this.parsers = parsers;
  }

  parse(state) {

    for (let p of this.parsers) {
      const nextState = p.parse(state);
      if (!nextState.isError) {
        return nextState;
      }
    }

    return {
      ...state,
      isError: true,
      error: 'any did not matched with any parsers'
    };
  }
}

class ManyParser extends Parser{
  constructor(parser) {
    super();
    this.parser = parser;
  }

  parse(state) {
    let results = [];
    let tempState = state;


    let flag = true;

    while(flag) {

      tempState = this.parser.parse(tempState);
      results.push(tempState.result);

      if (tempState.endsAt === tempState.input.length) {
        flag = false;
      }
    }

    return {
      ...tempState,
      result: results
    };
  }
}

let parser = new ManyParser(new AnyParser([
  new LetterParser('keyword'),
  new AnyParser([
    new StringParser('>', 'child'),
    new StringParser('+', 'sibling'),
    new StringParser('*', 'mult'),
    new StringParser('#', 'tag'),
  ]),
  new AnyParser([
    new DigitParser(),
    new LetterParser('keyword'),
  ])
]));


let state = generateState('ul>li*5');
let result = parser.parse(state);

function eval(state) {

  let target = '';

  for (let i = (state.result.length - 1); i >= 0; i--) {

    if (state.result[i].type == 'keyword') {
      target += `<${state.result[i].res}></${state.result[i].res}>\n`;
    }

    if (state.result[i].type == 'sibling') {
      target += `<${state.result[i - 1].res}></${state.result[i - 1].res}>\n`;
      i--;
    }

    if (state.result[i].type == 'mult') {
      for (let j = 0; j <= state.result[i + 1].value; j++) {
        target += `<${state.result[i - 1].res}></${state.result[i - 1].res}>\n`;
      }
      i = i - 1;
    }

    if (state.result[i].type == 'child') {
      target = target.concat(`</${state.result[i - 1].res}>\n`);
      target = String(`<${state.result[i - 1].res}>\n`).concat(target);
      i--;
    }

  }

  return target; 
}

console.log(eval(result));
