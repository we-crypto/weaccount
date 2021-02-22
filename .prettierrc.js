module.exports = {
  // 箭头函数只有一个参数的时候可以忽略括号
  arrowParens: 'avoid',
  singleQuote: true,
  // true: Put > on the last line instead of at a new line
  jsxBracketSameLine: false,
  // jsx 属性使用双引号
  jsxSingleQuote: false,
  parser: 'typescript',
  tabWidth: 2,
  bracketSpacing: false,
  printWidth: 80,
  endOfLine: 'auto',
  // 后置逗号，多行对象、数组在最后一行增加逗号
  trailingComma: 'all',
};
