<template>
  <div class="game-container" :class="boardColor">
    <div class="status" >
      <div class="bar is-clickable" @click="setClock">
        <div class="bar-progress"></div>
      </div>
    </div>
    <div class="container is-widescreen">
      <div class="content fadeIn">
        <div class="columns is-marginless-top fadeIn">
          <div class="column">
            <div class="board-container">
              <h6 class="black has-text-left" v-show="game">
                <span class="is-size-6"> </span>
              </h6>
              <div class="board preservefilter">
                <div class="score-container">
                  <div class="score" :style="'max-height:' + vscore + '%'"></div>
                </div>
                <div id="board" class="is-clickable" @click="gamePause"></div>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="board-assistant" v-if="Object.keys(data).length">
              <div class="columns has-text-centered">
                <div class="column preservefilter">
                  <div class="buttons levels has-addons preservefilter">
                    <button @click="gameFlip()" class="button is-rounded is-info" title="Girar tablero">
                      <span class="icon">
                        <span class="mdi mdi-flip-vertical"></span>
                      </span>
                    </button>
                    <button @click="showPGN()" class="button is-rounded is-info" v-if="pgnIndex.length" title="Mostrar PGN">
                      <strong>PGN</strong>
                    </button>
                  </div>
                </div>
              </div>
              <div class="columns has-text-centered">
                <div class="column">
                  <div class="field">
                    <strong v-html="data.eco" class="has-text-grey is-size-5"></strong>
                    <span v-html="data.name" class="has-text-black is-size-5"></span>
                  </div>
                </div>
              </div>
              <div class="columns is-hidden-mobile">
                <div class="chart-container preservefilter">
                  <div :class="orientation">
                    <div class="chart" v-show="pgnIndex.length"></div>
                  </div>
                </div>
              </div>
              <div class="columns is-hidden-mobile">
                <div class="movesTableContainer preservefilter">
                  <div class="movesTable">
                    <div class="moveRow" v-for="(move, index) in pgnIndex" :key="index">
                      <div class="moveNumCell" :class="{ 'moveRowOdd': move.odd, 'moveRowEven': !move.odd }">
                        <span v-html="(index+1)"></span>
                      </div>

                      <div class="moveCell moveSAN movew" :class="{ 'moveRowOdd': move.odd, 'moveRowEven': !move.odd }">
                        <a :class="'moveindex m' + (move.i-2)" @click="gamePos(move.i-2)">
                          <span v-html="move.white"></span>
                        </a>
                      </div>

                      <div class="moveCell moveSAN moveb" :class="{ 'moveRowOdd': move.odd, 'moveRowEven': !move.odd }">
                        <a :class="'moveindex m' + (move.i-1)" @click="gamePos(move.i-1)">
                          <span v-html="move.black"></span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex'
import axios from 'axios'
import Chess from 'chess.js'
import Chessboard from '.././assets/js/chessboard'
import swal from 'sweetalert'
import PlaySound from '../components/PlaySound'

export default {
  name: 'opening',
  mounted () {
    window.app = this
    if (localStorage.getItem('speed')) {
      this.speed = parseInt(localStorage.getItem('speed'))
    }
    this.gameStart()
  },
  computed: {
    ...mapState([
      'player',
      'stockfishEvalTime'
    ])
  },
  methods: {
    gameMove () {
      /* global $ */
      if (!this.paused) {
        var move = this.gameMoves[this.index]

        // exit if the game is over
        if (!move || this.game.game_over() === true ||
            this.game.in_draw() === true ||
            this.gameMoves.length === 0) return

        document.querySelectorAll('.moveindex').forEach((item) => {
          item.parentNode.classList.remove('active')
        })

        var perc = (this.index + 1) / this.gameMoves.length * 100
        $('.bar-progress').animate({ width: perc + '%' }, this.speed, 'linear')
        document.querySelector('.moveindex.m' + this.index).parentNode.classList.add('active')

        var n = document.querySelector('.moveindex.m' + this.index).parentNode.offsetTop
        var x = document.querySelector('.moveindex.m' + this.index).parentNode.clientHeight
        var y = n + x
        var h = parseInt(document.querySelector('.movesTableContainer').style.height)
        if (y > h) {
          document.querySelector('.movesTableContainer').scrollTop = n
        }

        this.index++
        const moved = this.game.move(move)
        this.board.position(this.game.fen())

        if (this.index === this.gameMoves.length) {
          this.gamePause()
        }

        setTimeout(() => {
          this.moveSound(moved)
          this.addHightlight(moved)
        }, 250)

        this.uciCmd('position startpos moves' + this.get_moves(), this.evaler)
        this.uciCmd('eval', this.evaler)

        setTimeout(this.gameMove, this.speed)
      }
    },
    calcPoints () {
      this.chart.points = []
      if (this.chart.values.length > 1) {
        var points = '0,' + this.chart.height + ' '
        for (var x = 0; x < this.chart.values.length; x++) {
          var perc = this.chart.values[x] / this.chart.maxValue
          var steps = 100 / (this.chart.values.length - 1)
          var point = (steps * (x)).toFixed(2) + ',' + (this.chart.height - (this.chart.height * perc)).toFixed(2) + ' '
          points += point
        }
        points += '100,' + this.chart.height
        this.chart.points = points
      }
    },
    drawChart () {
      var score = parseInt(this.vscore)

      if (this.orientation === 'white') {
        score = 100 - score
      }

      if (score < 0) {
        score = 0
      }

      if (score > 100) {
        score = 100
      }

      if (!isNaN(score)) {
        this.chart.values.push(score)
        this.updateChart()
      }
    },
    updateChart () {
      this.calcPoints()

      var element = document.getElementsByClassName('chart')[0]
      element.innerHTML = ''

      var width = document.querySelector('.movesTableContainer').clientWidth + 'px'
      var chart = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      chart.setAttribute('width', '100%')
      chart.setAttribute('height', '100%')
      chart.setAttribute('preserveAspectRatio', 'none')
      chart.setAttribute('viewBox', '0 0 ' + this.chart.width + ' ' + this.chart.height)

      var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      polygon.setAttribute('points', this.chart.points)

      if (this.chart.values.length > 1) {
        element.style.width = width
        element.appendChild(chart)
        chart.appendChild(polygon)
      }
    },
    moveSound (move) {
      var sound = 'move.mp3'

      if (move.flags === 'c') {
        sound = 'capture.mp3'
      }

      if (move.flags === 'k') {
        sound = 'castle.mp3'
      }

      if (move.flags === 'q') {
        sound = 'castle.mp3'
      }

      if (this.game.in_check() === true) {
        sound = 'check.ogg'
      }

      PlaySound(sound)
    },
    get_moves () {
      var moves = ''
      var history = this.game.history({ verbose: true })

      for (var i = 0; i < history.length; ++i) {
        var move = history[i]
        moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '')
      }

      return moves
    },
    gamePGN (pgn) {
      var data = []
      pgn.split('.').forEach(function (turn) {
        turn.split(' ').forEach(function (move) {
          if (move.length) {
            if (isNaN(move) && move.length > 1) {
              data.push(move)
            }
          }
        })
      })
      return data
    },
    gamePGNIndex (pgn) {
      var data = []
      pgn.split('.').forEach(function (turn, i) {
        const white = turn.split(' ')[1] || ''
        const black = turn.split(' ')[2] || ''
        if (isNaN(white)) {
          data.push({
            white: white,
            black: black,
            i: Math.ceil(i * 2),
            odd: i % 2 === 0
          })
        }
      })
      return data
    },
    showPGN () {
      var pgn = this.data.pgn + ' ' + (this.data.result ? this.data.result : '')
      const template = (`
<div class="content">
  <div class="columns columns-bottom is-flex has-text-centered">
    <div class="column">
      <div class="control">
        <div class="field">
          <textarea class="textarea" readonly>${pgn}</textarea>
        </div>
      </div>
    </div>
  </div>
</div>`)
      swal({
        title: 'Copiar PGN',
        content: {
          element: 'div',
          attributes: {
            innerHTML: `${template}`
          }
        }
      })
    },
    uciCmd (cmd, which) {
      // console.log("UCI: " + cmd);
      (which || this.evaler).postMessage(cmd)
    },
    gameStart () {
      /* global $ */
      /* global STOCKFISH */
      axios.post('/eco/search', {
        query: this.$route.params.name,
        limit: 1,
        offset: 0
      }).then((res) => {
        var game = res.data.games[0]
        const pref = JSON.parse(localStorage.getItem('player')) || {}
        const totalms = this.$root.countMoves(game.pgn) * this.speed
        this.gameMoves = this.gamePGN(game.pgn)
        this.pgnIndex = this.gamePGNIndex(game.pgn)
        this.data = game
        this.duration = totalms / 1000

        setTimeout(() => {
          this.boardEl = document.getElementById('board')
          this.$root.fullscreenBoard()
          this.game = new Chess()

          if (pref.pieces) {
            this.boardCfg.pieceTheme = `/img/chesspieces/${pref.pieces}/{piece}.png`
            this.boardCfg.moveSpeed = this.player.moveSpeed
            this.boardColor = pref.board
          }

          this.board = Chessboard('board', this.boardCfg)
          this.orientation = this.board.orientation()

          window.onresize = function (event) {
            this.board.resize()
            this.highlightLastMove()
            this.$root.fullscreenBoard()
          }

          PlaySound('start.ogg')

          const offset = 200
          setTimeout(() => {
            document.querySelector('.movesTableContainer').style.height = ($('.board').height() - offset) + 'px'

            setTimeout(() => {
              /* autoplay kickstart */
              this.$root.loading = false
              this.gameMove()
            }, 1000)
          }, 500)
        }, 2000)

        this.evaler = typeof STOCKFISH === 'function' ? STOCKFISH() : new Worker('/js/stockfish.js')

        this.evaler.onmessage = function (event) {
          var t = window.app
          var line

          if (event && typeof event === 'object') {
            line = event.data
          } else {
            line = event
          }

          // console.log("evaler: " + line);

          var match = line.match(/^Total evaluation: (-?\d+\.\d+)/)
          if (match) {
            t.score = parseFloat(match[1])
            t.vscore = 50 - (t.score / 64 * 100)
            t.drawChart()
          }

          /// Ignore some output.
          if (line === 'uciok' || line === 'readyok' || line.substr(0, 11) === 'option name') {

          }
        }
      })
    },
    removeHighlight () {
      document.getElementById('board').querySelectorAll('.square-55d63').forEach((item) => {
        item.classList.remove('highlight-move')
        item.classList.remove('in-check')
      })
    },
    addHightlight (move) {
      this.removeHighlight()
      if (move) {
        if (this.game.in_check() === true) {
          document.getElementById('board').querySelector('img[data-piece="' + this.game.turn() + 'K"]').classList.add('in-check')
        }
        document.getElementById('board').querySelector('.square-' + move.from).classList.add('highlight-move')
        document.getElementById('board').querySelector('.square-' + move.to).classList.add('highlight-move')
      }
    },
    highlightLastMove () {
      var history = this.game.history({ verbose: true })
      if (history.length) {
        var move = history[history.length - 1]
        this.addHightlight(move)
      }
    },
    gameFlip () {
      this.board.flip()
      this.orientation = this.board.orientation()
      this.highlightLastMove()
    },
    gamePos (pos) {
      /* global $ */
      if (pos > this.gameMoves.length) {
        return
      }

      this.index = pos

      const moves = this.gameMoves.slice(0, this.index)
      var move = this.gameMoves[this.index]
      // ---------------
      var pgn = []
      moves.forEach((move, i) => {
        if (i % 2) {
          pgn.push(move)
        } else {
          pgn.push([Math.ceil(i / 2) + 1, move].join('. '))
        }
      })

      document.querySelectorAll('.moveindex').forEach((item) => {
        item.parentNode.classList.remove('active')
      })

      document.querySelector('.moveindex.m' + this.index).parentNode.classList.add('active')

      var perc = (this.index + 1) / this.gameMoves.length * 100
      $('.bar-progress').animate({ width: perc + '%' }, 100, 'linear')
      const pgns = pgn.join(' ')
      this.game.reset()
      this.game.load_pgn(pgns)

      const moved = this.game.move(move)
      this.board.position(this.game.fen())

      setTimeout(() => {
        this.moveSound(moved)
        this.addHightlight(moved)
      }, 250)

      if (!this.paused) {
        this.gamePause()
      }
    },
    gamePause () {
      this.paused = !this.paused
      document.querySelector('.bar-progress').classList.remove('paused')
      if (this.paused) {
        document.querySelector('.bar-progress').classList.add('paused')
      } else {
        setTimeout(this.gameMove, 500)
      }
    },
    gameSpeed (s) {
      this.speed += s
      if (this.speed >= 1000 && this.speed <= 10000) {
        localStorage.setItem('speed', this.speed)
      } else {
        this.speed -= s
      }
    },
    setClock () {
      this.gamePause()
      swal('Ingresa el intervalo en milisegundos entre 1000/60000', {
        content: {
          element: 'input',
          attributes: {
            placeholder: 'Valor en milisegundos',
            value: this.speed
          }
        },
        closeOnClickOutside: false
      })
        .then((speed) => {
          if (speed) {
            speed = parseInt(speed)
            if (speed > 60000 || speed < 1000) {
              swal('El valor debe ser entre 1000 / 60000')
            } else {
              this.speed = speed
              localStorage.setItem('speed', speed)
              const totalms = this.$root.countMoves(this.data.pgn) * this.speed
              this.duration = totalms / 1000
            }
          }
          this.gamePause()
        })
        .catch(() => {
          this.gamePause()
        })
    }
  },
  data () {
    return {
      chart: {
        width: 100,
        height: 50,
        maxValue: 100,
        points: [],
        values: []
      },
      boardCfg: {
        position: 'start',
        draggable: false,
        moveSpeed: 250,
        pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
      },
      boardColor: 'classic',
      orientation: null,
      data: {},
      eco: {},
      score: 0.10,
      vscore: 49,
      duration: 0,
      ecode: '',
      opening: '',
      board: null,
      game: null,
      gameMoves: [],
      pgnIndex: [],
      boardEl: null,
      index: 0,
      paused: false,
      speed: 1000
    }
  }
}
</script>
