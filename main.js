

// 从input文件夹中读取所有文件
const dayjs = require('dayjs');
const log = console.log.bind(console)
const showdown = require('showdown')
const mdConverter = new showdown.Converter()
const fs = require('fs');
const promisify = require('util').promisify
const path = require('path')
const fileUtil = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  mkdir: promisify(fs.mkdir),
}


class AgreementConverter {
  // 参数
  // dataFileName, string, 必传,数据文件名
  // lineHandler,  func(lines), 必传,行处理函数
  // outputFileName = '', string, 非必传, 文件名(不含后缀), 不传则会按时间自动命名
  // outputDir = './output', string, 非必传, 输出文件夹
  // outputExt = '.json', srting, 非必传,文件后缀
  // outputFileNamePrefix = 'result' , string,非必传, 自动生成结果文件名的前缀

  constructor(config) {
    let defaultConfig = {
      inputDir: './input',
      outputDir: './output',
      outputExt: '.html',
      outputFileName: '',
      outputFileNamePrefix: 'result',

    }
    let all = { ...defaultConfig, ...config }

    this.dataFileName = all.dataFileName
    this.inputDir = all.inputDir
    this.outputDir = all.outputDir
    this.outputExt = all.outputExt
    this.lineHandler = all.lineHandler
    this.outputFileName = all.outputFileName
    this.outputFileNamePrefix = all.outputFileNamePrefix


    // this.formatLine = this.formatLine.bind(this)
    this.saveToFile = this.saveToFile.bind(this)
    this.getOutputFileName = this.getOutputFileName.bind(this)
    this.dataToStr = this.dataToStr.bind(this)

    // this.formatData = this.formatData.bind(this)
    // this.getLineArray = this.getLineArray.bind(this)

  }
  // constructor() {
  //   this.outputDir = './output'
  // }
  //   getFiles() {

  //     return [
  //       '# hello',
  //       `1. one
  // 2. two
  // - 123
  // - 234`,
  //     ]
  //   }

  getOutputFileName() {
    let fileName = ''
    if (this.outputFileName) {
      fileName = this.outputFileName + this.outputExt
    } else {
      let now = dayjs(new Date()).format('_YYYYMMDD_HHmmss_SSS')
      fileName = this.outputFileNamePrefix + now + this.outputExt
    }
    // let now = new Date().getTime()

    let fullName = path.join(this.outputDir, fileName)
    return fullName
  }


  toMarkdown(str) {
    let clone = str
    let rules = [
      { from: /^\s+/mg, to: "" },
      { from: /\s+\n/mg, to: "\n" },
      { from: /\n+/mg, to: "  \n" },
      { from: /^\d{1,2}、/mg, to: "1. " },
      { from: /(?=^[^\s0-9]{1,2}、)/mg, to: "## " },
      // { from: /\(\d{1,2}\)|（\d{1,2}）/mg, to: "\t\n1. " },
      {
        from: /\(\d{1,2}\)|（\d{1,2}）/mg,
        to: str => `  \n${str}`
      },

    ]
    for (let rule of rules) {
      // log(rule)

      let { from, to } = rule
      clone = clone.replace(from, to)
    }
    clone = `# ${clone}`
    log(clone)

    return clone
  }

  dataToStr(data) {
    let str = data
    if (typeof data === 'object') {
      str = JSON.stringify(data, null, 2)
    } else if (typeof data === 'string') {
      str = data
    } else {
      throw new Error(`filetype error ${typeof data}`)
    }
    return str
  }

  saveToFile(data) {
    //===============================
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir)
    }
    // save(str, dir)
    let filename = this.getOutputFileName()
    // let filename = __dirname + '/output/' + 'out.html'
    let dataStr = this.dataToStr(data)
    fileUtil.writeFile(filename, dataStr)
    return filename;
  }
  convertOnce(filename) {
    fileUtil.readFile(path.join(__dirname, this.inputDir, filename), 'utf-8')
      .then(text => {
        let md = this.toMarkdown(text)
        let html = mdConverter.makeHtml(md)
        return html
      })
      .then(html => {
        this.saveToFile(html)
        return html
      })
      // .then(html => {
      //   log(html)
      // })
      .catch(e => {
        log(e)
      })
  }


  run() {
    let files = fs.readdirSync(this.inputDir)
    for (let f of files) {
      this.convertOnce(f)
      log('完成 ' + f)
    }
    log('全部完成')
  }
}

function test() {
  let a = new AgreementConverter()
  a.run()
}

test()