# Markdown converter
Це простий застосунок для конвертації .md файлів у html розмітку. Якщо бути більш конкретним, то відбувається заміна Markdown тегів у певній відповідності на html теги. Програма реалізована у вигляді CLI (Command Line Interface), і приймає у себе один обов'язковий аргумент та один опційний. Обов'язковим аргументом є сам шлях до .md файлу, опційним таки є аргумент для створення/запису файлу з вже готовими html тегами. Варто зазначити, що шлях можна вказати відносно того місце, де ви прописуєте команду. Тобто якщо ви це робите у теці з .md файлом, то можна просто зазначити назву цього файлу. Формат файлу для завантаження має бути обов'язково .md.

### Перелік Тегів:
 - ```**``` **Bold Text** -> <b>Bold Text</b>
 - ```_``` *Italic Text* -> <i>Italic Text</i>
 - ``` `` ``` *Monospaced Text* -> <tt>Monospaced Text</tt>
 - ``` ` ` ` ``` *Code Block* -> <pre>Code Block</pre>


## Requirements
 - Node.js

## Installation
```cmd
  npm install
  npm link
```
## Usage
```
> mycli <path> [-o <path>]
```
![скріншот](https://github.com/Patriot0911/mpz_lab1/assets/75264092/8ab0674d-beb6-4947-a163-23dfa2c73e51)

## Revert Commit
[Click on me](https://github.com/Patriot0911/mpz_lab1/commit/45df685f8689a4edfa47c26d5ca66625a47d6b60)
