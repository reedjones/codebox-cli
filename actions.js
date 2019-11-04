const clipboardy = require('clipboardy')
const logger = require('@janjanmedinaaa/clean/lib/Logs')
const fs = require('fs')

const files = require('./utils/files')
const tools = require('./utils/tools')
const inquirer  = require('./utils/inquirer');
const strings = require('./strings.json')
const vim = require('./utils/vim')

const CODE_FOLDER = 'codebox-codes'
const FOLDER_PWD = `${files.getCodeboxDirLocation()}/${CODE_FOLDER}`
const LANGUAGES_PWD = `${FOLDER_PWD}/languages.json`

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

const getProgrammingLanguageFilename = async(language) => {
  var languageData = files.readJSONFile(LANGUAGES_PWD)
  var languages = languageData.languages

  if (languages.length === 0) {
    logger.error(strings.error.noLanguageFound)
    return
  }

  var languageResult = 
    await inquirer.checkForLanguageExisting(
      language, 
      languageData.languages
    )
  var filename = tools.createCodeSnippetFileName(
    FOLDER_PWD, 
    languageResult.language
  )

  if (!fs.existsSync(filename)) {
    logger.error(strings.error.noLanguageFound)
    return null
  }

  return { filename, language: languageResult.language }
}

const codeSnippetList = async(language) => {
  var programmingLanguage = await getProgrammingLanguageFilename(language)
  if (programmingLanguage == undefined) return

  var jsonData = files.readJSONFile(programmingLanguage.filename)

  if (jsonData.snippets.length === 0) {
    logger.error(strings.error.noCodeSnippetsFound)
    return
  }

  var snippetResult = await inquirer.createChooser(
    'snippet', 
    'Choose Code Spinnet:', 
    Array.from(jsonData.snippets, (x, y) => {
      return `${y+1}. ${x.language.capitalize()} - ${x.title}`
    })
  )

  return { 
    jsonData, 
    snippetResult, 
    languageResult: programmingLanguage.language,
    filename: programmingLanguage.filename 
  }
}

const initializeCodebox = () => {
  if (fs.existsSync(FOLDER_PWD)) {
    logger.warning(strings.warning.codeboxInitialized)
    return
  }

  files.writeFolder(FOLDER_PWD)
  files.writeJSONFile({ languages: [] }, LANGUAGES_PWD)

  logger.success(strings.success.codeboxInitialized)
}

const createProgrammingLanguage = async({ language }) => {
  var languageResult = await inquirer.checkForLanguageNew(language)
  var filename = tools.createCodeSnippetFileName(FOLDER_PWD, languageResult.language)
  var languageData = files.readJSONFile(LANGUAGES_PWD)
  var jsonData = tools.createLanguage(languageResult.language)

  if (fs.existsSync(filename)) {
    logger.warning(strings.warning.languageExists)
    return
  }

  languageData.languages.push({
    id: tools.createNewID(languageData.languages),
    language: languageResult.language,
    location: filename,
    date: Date()
  })

  files.writeJSONFile(languageData, LANGUAGES_PWD)
  files.writeJSONFile(jsonData, filename)

  logger.success(`${languageResult.language} Programming Language created.`)
}

const createCodeSnippet = async({ language, title, clipboard }) => {
  var programmingLanguage = await getProgrammingLanguageFilename(language)

  if (programmingLanguage == undefined) return 
  var jsonData = files.readJSONFile(programmingLanguage.filename)

  var snippetTitleResult = 
    await inquirer.checkForCodeSnippetTitle(title)

  var code = (clipboard) ? clipboardy.readSync() : await vim.editorSync({})

  var jsonData = files.readJSONFile(programmingLanguage.filename)
  jsonData.snippets.push({
    id: tools.createNewID(jsonData.snippets),
    language: programmingLanguage.language,
    title: snippetTitleResult.title,
    code
  })

  files.writeJSONFile(jsonData, programmingLanguage.filename)
  logger.success(`${programmingLanguage.language} Code Snippet added.`)
}

const getAllCodeSnippets = async({ language }) => {
  var results = await codeSnippetList(language)

  if (results == undefined) return
  var resultIndex = tools.getCodeboxIndex(results.snippetResult.snippet) 

  clipboardy.writeSync(results.jsonData.snippets[resultIndex].code.trim())
  logger.success(strings.success.copiedToClipboard)
}

const updateCodeSnippets = async({ language, clipboard }) => {
  var results = await codeSnippetList(language)

  if (results == undefined) return
  var resultIndex = tools.getCodeboxIndex(results.snippetResult.snippet) 
  var codeSnippet = results.jsonData.snippets[resultIndex]

  var code = (clipboard) ? clipboardy.readSync() : vim.editorSync({ content: codeSnippet.code })
  results.jsonData.snippets[resultIndex].code = code.trim()

  files.writeJSONFile(results.jsonData, results.filename)
  logger.success(`${results.languageResult} Code Snippet updated.`)
}

const deleteCodeSnippets = async({ language }) => {
  var results = await codeSnippetList(language)
  
  if (results == undefined) return
  var resultIndex = tools.getCodeboxIndex(results.snippetResult.snippet) 
  results.jsonData.snippets.splice(resultIndex, 1)

  files.writeJSONFile(results.jsonData, results.filename)
  logger.success(strings.success.deleteCodeSnippet)
}

const exportCodebox = async({ language }) => {
  var programmingLanguage = await getProgrammingLanguageFilename(language)

  if (programmingLanguage == undefined) return 
  var jsonData = files.readJSONFile(programmingLanguage.filename)
  var mdData = tools.createMDFromJSON(jsonData)
  var mdFilename = tools.createMDFileName(programmingLanguage.language)

  files.writeFile(mdFilename, mdData)
  logger.success(`${programmingLanguage.language} Code Snippet exported.`)
}

const searchCodeSnippets = async({ keyword }) => {
  var languageData = files.readJSONFile(LANGUAGES_PWD)

  var keywordResult = await inquirer.checkForKeyword(keyword)
  var searchResults = tools.searchCodeSnippet(
    languageData.languages, 
    keywordResult.keyword
  )

  logger.success(`${searchResults.length} results found.`)

  if (searchResults != 0) {
    var snippetResult = await inquirer.createChooser(
      'snippet', 
      'Choose Code Spinnet:', 
      Array.from(searchResults, (x, y) => {
        return `${y+1}. ${x.language.capitalize()} - ${x.title}`
      })
    )
    
    var resultIndex = tools.getCodeboxIndex(snippetResult.snippet) 
    clipboardy.writeSync(searchResults[resultIndex].code.trim())
    logger.success(strings.success.copiedToClipboard)
  }
}

module.exports = {
  initializeCodebox,
  createProgrammingLanguage,
  createCodeSnippet,
  getAllCodeSnippets,
  updateCodeSnippets,
  deleteCodeSnippets,
  exportCodebox,
  searchCodeSnippets
}