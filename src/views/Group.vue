<template>
  <div class="container is-widescreen">
    <div v-show="!data.owner && tried" class="content column fadeIn">
      <section class="hero fadeIn">
        <div class="hero-body">
          <div class="container is-flex-column is-vertical">
            <h1 class="title">
              <span class="icon is-margin-right">
                <span class="mdi mdi-robot"></span>
              </span>
              <span>{{ 'group_not_found' | t }}</span>
            </h1>
            <p v-if="player.email">{{ 'create_group_invitation' | t }} <a @click="$root.createGroup">{{ 'create_it' | t }}</a></p>
            <p v-else>{{ 'group_not_found_text' | t }}</p>
          </div>
        </div>
      </section>
    </div>
    <div v-show="data.owner" class="content column fadeIn">
      <div class="columns">
        <div v-if="players && data && data.owner" class="column is-lobby-list is-3">
          <div v-if="data.owner._id === player._id">
            <h3 class="is-clickable" @click="setGroupRules" title="Configurar Grupo">
              <span class="icon">
                <span class="mdi mdi-layers"></span>
              </span>
              <span>{{data.code}}</span>
            </h3>
          </div>
          <div v-else>
            <h3>
              <span class="icon">
                <span class="mdi mdi-layers"></span>
              </span>
              <span>{{data.code}}</span>
            </h3>
          </div>
          <div>
            <div v-for="(plyer, index) in players" :key="index">
              <router-link :to="`/results?q=${plyer.code}&strict=1`" :title="'Invitar a ' + plyer.code">
                <span class="mini-button has-background-light">
                  <span class="icon preservefilter">
                    <span v-html="plyer.flag"></span>
                  </span>
                  <span class="has-text-grey" v-html="plyer.code"></span>
                  <span class="has-text-primary" v-html="plyer.elo"></span>
                  <span v-show="plyer.plying" class="icon is-size-6 has-margin has-text-success">
                    <span class="mdi mdi-chess-king"></span>
                  </span>
                  <span v-show="plyer.observe" class="icon is-size-6 has-margin has-text-grey">
                    <span class="mdi mdi-eye"></span>
                  </span>
                </span>
              </router-link>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="tabs is-boxed is-marginless">
            <ul>
              <li :class="{ 'is-active' : tab === 'results' }">
                <a @click="setTab('results')" :title="'results' | t">
                  <span class="icon"><i class="mdi mdi-view-list" aria-hidden="true"></i></span>
                </a>
              </li>
              <li :class="{ 'is-active' : tab === 'chat' }">
                <a @click="setTab('chat')" title="Chat">
                  <span class="icon"><i class="mdi mdi-comment-text-outline" aria-hidden="true"></i></span>
                </a>
              </li>
              <li v-show="games.length" :class="{ 'is-active' : tab === 'playing' }">
                <a @click="setTab('playing')" :title="'playing_now' | t" class="has-background-light">
                  <span class="icon"><i class="mdi mdi-chess-king" aria-hidden="true"></i></span>
                </a>
              </li>
            </ul>
          </div>
          <div v-show="tab === 'playing'">
            <div class="group" v-show="onlineGames.length" :class="{ 'no-players': players.length < 2 }">
              <div class="columns is-multiline">
                <div v-for="(match, index) in onlineGames" :key="index" class="column is-4">
                  <div :class="'board-container b' + match.id">
                    <div :class="$root.boardColor">
                      <h6 class="has-text-left black is-clickable" @click="$root.gameFlip(match.id)">
                        <span class="button is-small" :class="{ 'has-background-grey has-text-white' : match.btime > 10, 'has-background-info has-text-white' : match.btime <= 10}">
                          <span class="icon">
                            <span class="mdi mdi-clock"></span>
                          </span>
                          <span v-html="$root.getTimeDisplay(match.btime)"></span>
                        </span>
                        <span class="button is-small is-text">
                          <span v-html="match.black"></span>
                          <span v-show="match.result==='0-1'" class="icon">
                            <span class="mdi mdi-trophy is-size-7 has-text-warning"></span>
                          </span>
                        </span>
                      </h6>
                      <router-link :to="'/watch/' + match.id">
                        <div class="board preservefilter">
                          <div :id="'board' + match.id"></div>
                        </div>
                      </router-link>
                      <h6 class="has-text-right white is-clickable" @click="$root.gameFlip">
                        <span class="button is-small is-text">
                          <span v-show="match.result==='1-0'" class="icon">
                            <span class="mdi mdi-trophy is-size-7 has-text-warning"></span>
                          </span>
                          <span v-html="match.white"></span>
                        </span>
                        <span class="button is-small" :class="{ 'has-background-white has-text-black' : match.wtime > 10, 'has-background-info has-text-white' : match.wtime <= 10}">
                          <span class="icon">
                            <span class="mdi mdi-clock"></span>
                          </span>
                          <span v-html="$root.getTimeDisplay(match.wtime)"></span>
                        </span>
                      </h6>
                    </div>
                    <div class="match-status has-text-info"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-show="tab === 'chat'">
            <div class="column has-text-centered box is-padded">
              <div class="columns">
                <div class="column chatbox-container">
                  <div class="chatbox fadeIn">
                    <div v-for="(line, index) in chatLines" :key="index" class="chatline">
                      <div class="chatbubble" :class="{ 'is-pulled-right has-text-right has-background-info' : line.owned, 'is-pulled-left has-text-left has-background-white' : !line.owned, 'has-background-light' : line.sender === 'bot' }">
                        <strong v-show="line.sender !== 'bot' && !line.owned">{{ line.sender }} </strong>
                        <span :class="{ 'has-text-grey' : line.sender === 'bot', 'has-text-white': line.owned }" v-html="line.text"></span>
                      </div>
                      <div v-show="line.sender != 'bot'" v-html="line.ts" class="ts is-size-7" :class="{  'is-pulled-right has-text-right' : line.owned, 'is-pulled-left has-text-left' : !line.owned, 'has-text-grey': line.sender !== 'bot', 'has-text-white': line.sender === 'bot' }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <form @submit.prevent="sendChat">
                <div class="field is-fullwidth has-addons has-addons-fullwidth is-marginless">
                  <div class="control">
                    <input class="input is-rounded" v-model="chat" type="text" placeholder="Ingresa tu mensaje" />
                  </div>
                  <div class="control has-text-left">
                    <button type="submit" class="button is-info is-rounded">
                      <span class="icon">
                        <span class="mdi mdi-arrow-up"></span>
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div v-show="tab === 'results'" class="fadeIn">
            <div v-show="data.results" class="column box">
              <div v-show="!data.results.length" class="column">
                <h6>{{ 'group_no_results' | t }}</h6>
              </div>
              <div class="columns is-multiline">
                <div class="column is-12-mobile is-6-tablet is-6-desktop is-4-fullhd" v-for="(item, index) in data.results" :key="index">
                  <game-list :data-item="item"/>
                </div>
              </div>
              <div v-if="showResultsAll" class="field column has-text-centered">
                <span class="button is-success is-rounded is-outlined">{{ 'show_all' | t }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import { mapState } from 'vuex'
import snackbar from '@/components/Snackbar'
import GameList from '@/components/GameList'
import swal from 'sweetalert'
import PlaySound from '@/components/PlaySound'
import Chess from 'chess.js'
import Chessboard from '../assets/js/chessboard'
export default {
  name: 'group',
  components: {
    GameList
  },
  data () {
    return {
      maxResults: 9,
      showResultsAll: false,
      groupKey: 0,
      chat: '',
      tab: 'results',
      tried: false,
      games: [],
      boards: [],
      data: {},
      group: {},
      chatlast: null,
      onlineGames: [],
      boardColor: null,
      players: [],
      chatLines: []
    }
  },
  computed: {
    ...mapState([
      'player'
    ])
  },
  created () {
    this.loadGroup()
  },
  beforeDestroy () {
    if (this.$route.name && this.$route.name !== 'play') {
      this.$socket.emit('group_leave', this.group)
    }
  },
  sockets: {
    group_updated (data) {
      this.data = data
      if (data.owner._id === this.player._id) {
        swal.close()
      }
      this.chatLines.push({
        text: `<span class="mdi mdi-cog"></span> ` + this.$root.t('group_updated'),
        ts: moment().fromNow(true),
        sender: 'bot',
        owned: false
      })
      this.scrollToBottom()
    },
    group_join (data) {
      setTimeout(() => {
        this.chatLines.push({
          text: `<span class="mdi mdi-arrow-right"></span> <span class="preservefilter">${data.flag}</span> ${data.code}`,
          ts: moment().fromNow(true),
          sender: 'bot',
          owned: false
        })
        this.scrollToBottom()
      }, 1000)
    },
    group_leave (data) {
      this.chatLines.push({
        text: `<span class="mdi mdi-arrow-left"></span> <span class="preservefilter">${data.flag}</span> ${data.code}`,
        ts: moment().fromNow(true),
        sender: 'bot',
        owned: false
      })
      this.scrollToBottom()
    },
    group_chat (data) {
      if (data.sender !== this.player.code) {
        this.chatLine(data)
      }
    },
    players (data) {
      if (this.$route.name === 'play') return
      this.players = data
      this.groupKey++
    },
    player (data) {
      if (data._id === this.player._id) {
        if (data.exists) {
          snackbar('error', `El nombre ${data.code} ya está en uso, por favor elige otro`)
          this.$router.push('/settings')
        } else {
          snackbar('success', `Ahora eres ${data.code}`)
          this.$socket.emit('group_chat', {
            id: this.$route.params.group,
            sender: 'bot',
            line: `${data.ref} ahora es ${data.code}`
          })
        }
      } else {
        snackbar('default', `${data.code} actualizó sus preferencias`)
        this.$socket.emit('group_chat', {
          id: this.$route.params.group,
          sender: 'bot',
          line: `${data.code} actualizó sus preferencias`
        })
      }
      this.$root.saving = false
    },
    play (data) {
      if (data.asker === this.player.code) {
        this.$store.dispatch('games', data)
        swal.close()
        this.$router.push(`/play/${this.$route.params.group}/${data.id}`)
      }
    },
    reject (data) {
      if (data.asker.code === this.player.code) {
        swal.close()
        swal('Partida declinada', data.player.code + ' declinó tu invitación')
        PlaySound('defeat.mp3')
      }
    },
    invite (data) {
      let id = this.$route.params.group
      if (data.player.code === this.player.code) {
        if (this.player.autoaccept) {
          axios.post(this.endpoint + '/game/create', {
            event: `Match a ${data.games}`,
            white: data.white.code,
            black: data.black.code,
            whiteflag: data.white.flag,
            blackflag: data.black.flag,
            group: id,
            minutes: data.minutes,
            games: data.games,
            compensation: data.compensation
          }).then((response) => {
            if (response.data.status === 'success') {
              this.$socket.emit('play', {
                asker: data.asker.code,
                player: data.player.code,
                id: response.data.id
              })
              this.$router.push(['/play', response.data.id].join('/'))
            } else {
              snackbar('danger', 'El juego no pudo ser creado.')
            }
          })
        } else {
          PlaySound('victory.mp3')
          const template = (`
    <div class="content">
    <h4>
      <span class="icon">
        <span class="mdi mdi-user"></span>
      </span> 
      <span>${data.asker.code} te invita a un match de ${data.games}</span>
    </h4>
    <h4>
      <span class="icon">
        <span class="mdi mdi-stopwatch"></span>
      </span>
      <span> ${data.minutes}' + ${data.compensation}</span>
    </h4>
    </div>`)
          swal({
            title: '¿Aceptás esta partida?',
            content: {
              element: 'div',
              attributes: {
                innerHTML: `${template}`
              }
            },
            buttons: ['Declinar', 'Aceptar'],
            closeOnClickOutside: false
          })
            .then(accept => {
              if (accept) {
                let id = this.$route.params.group
                axios.post('/game/create', {
                  white: data.white.code,
                  whiteflag: data.white.flag,
                  black: data.black.code,
                  blackflag: data.black.flag,
                  group: id,
                  minutes: data.minutes,
                  compensation: data.compensation
                }).then(res => {
                  if (res.data.status === 'success') {
                    this.$socket.emit('play', {
                      asker: data.asker.code,
                      player: data.player.code,
                      id: res.data.id
                    })
                    this.$store.dispatch('games', res.data)
                    this.$router.push(`/play/${res.data.id}`)
                  } else {
                    snackbar('danger', 'El juego no pudo ser creado.')
                  }
                })
              } else {
                this.$socket.emit('reject', data)
                console.log('Clicked on cancel')
              }
            })
        }
      }
    },
    games (data) {
      this.onlineGames = data
      for (var i in data) {
        if (!this.games[data[i].id]) {
          this.gameStart(data[i])
        }
      }
    },
    game (data) {
      console.log('game')
      console.log(data)
      var gamesContainer = document.querySelector('.live-games')
      if (gamesContainer) {
        var exists = false
        for (var i in this.onlineGames) {
          if (this.onlineGames[i].id === data.id) {
            exists = true
          }
        }

        if (exists === false) {
          this.onlineGames.push(data)
        }

        setTimeout(() => {
          this.gameMove(data)
        }, 500)
      }
    }
  },
  methods: {
    setTab (tab) {
      this.tab = tab
      if (tab === 'chat') {
        this.scrollToBottom()
      }
    },
    setGroupName () {
      swal('Ingresá un nombre para tu grupo', {
        content: {
          element: 'input',
          attributes: {
            className: 'input is-rounded',
            placeholder: 'Nombre del grupo',
            value: this.data.code
          }
        }
      })
        .then(code => {
          if (code) {
            if (code.length > 15) {
              swal('El valor debe tener entre 1 / 15 caracteres')
            } else {
              this.$socket.emit('group', { id: this.$route.params.group, code: code })
              this.data.code = code
            }
          }
        })
        .catch(() => {
        })
    },
    setGroupRules () {
      const template = (`
<div class="content">
  <div class="columns is-group-edit is-flex has-text-centered">
    <div class="column">
      <h4>
        <span class="icon">
          <span class="mdi mdi-edit"></span>
        </span>
        <span>Nombre</span>
      </h4>
      <div class="field">
        <div class="control has-text-centered column">
          <input class="input is-rounded groupcode" maxlength="15" value="${this.data.code}">
        </div>
      </div>
      <h4>
        <span class="icon">
          <span class="mdi mdi-eye"></span>
        </span>
        <span>Privacidad</span>
      </h4>
      <div class="field">
        <div class="control has-text-centered column">
          <div class="buttons levels has-addons groupprivacy" title="Establece la Privacidad para este Grupo">
            <button class="button is-toggle is-rounded" title="Cualquier persona podrá unirse a este Grupo">Público</button>
            <button class="button is-toggle is-rounded" title="Solo vos y las personas con quien compartas podrán unirse al grupo">Privado</button>
          </div>
        </div>
      </div>
    </div>
    <div class="column">
      <h4>
        <span class="icon">
          <span class="mdi mdi-retweet"></span>
        </span>
        <span>Rondas</span>
      </h4>
      <div class="field">
        <div class="control has-text-centered column">
          <div class="buttons levels has-addons groupgames" title="Nro. partidas de este match">
            <button class="button is-toggle is-rounded has-background-success" title="Match a 1 partida">1</button>
            <button class="button is-toggle" title="Match a 3 partidas">3</button>
            <button class="button is-toggle" title="Match a 5 partidas al match">5</button>
            <button class="button is-toggle" title="Match a 10 partidas">10</button>
            <button class="button is-toggle is-rounded" title="Match a 16 partidas">16</button>
          </div>
        </div>
      </div>
      <h4>
        <span class="icon">
          <span class="mdi mdi-clock"></span>
        </span>
        <span>Minutos</span>
      </h4>
      <div class="field">
        <div class="control has-text-centered column">
          <div class="buttons levels has-addons gameclock" title="Establece la duración de las partidas en minutos">
            <button class="button is-toggle is-rounded has-background-success" title="Partidas de 3 minutos">3'</button>
            <button class="button is-toggle" title="Partidas de 5 minutos">5'</button>
            <button class="button is-toggle" title="Partidas de 10 minutos">10'</button>
            <button class="button is-toggle is-rounded" title="Partidas de 30 minutos">30'</button>
          </div>
        </div>
      </div>
      <h4>
        <span class="icon">
          <span class="mdi mdi-stopwatch"></span>
        </span>
        <span>Compensación en segundos</span>
      </h4>
      <div class="field">
        <div class="control has-text-centered column">
          <div class="buttons levels has-addons gamecompensation" title="Agregar compensación por movimiento">
            <button class="button is-toggle is-rounded" title="Partidas sin compensación por movimiento">+0</button>
            <button class="button is-toggle" title="Partidas con 1 segundo de compensación por cada movimiento">+1</button>
            <button class="button is-toggle has-background-success" title="Partidas con 2 segundos de compensación por cada movimiento">+2</button>
            <button class="button is-toggle is-rounded" title="Partidas con 3 segundos de compensación por cada movimiento">+3</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`)
      swal({
        title: `${this.data.code}`,
        buttons: ['Cancelar', 'Actualizar'],
        className: 'is-wide',
        closeOnClickOutside: false,
        content: {
          element: 'div',
          attributes: {
            innerHTML: `${template}`
          }
        }
      }).then(accept => {
        if (accept) {
          var groupprivacy = document.querySelector('.groupprivacy > .has-background-success')
          var groupcode = document.querySelector('.groupcode')
          var gameclock = document.querySelector('.gameclock > .has-background-success')
          var groupgames = document.querySelector('.groupgames > .has-background-success')
          var gamecompensation = document.querySelector('.gamecompensation > .has-background-success')
          var minutes = parseInt(gameclock.textContent)
          var games = parseInt(groupgames.textContent)
          var compensation = parseInt(gamecompensation.textContent)
          var code = groupcode.value
          var broadcast = groupprivacy.textContent.toLowerCase() !== 'privado'

          swal({
            title: 'Actualizando grupo',
            text: 'Tu grupo se está actualizando...',
            buttons: false
          })

          setTimeout(() => {
            let group = {
              _id: this.data._id,
              minutes: minutes,
              games: games,
              broadcast: broadcast,
              code: code,
              compensation: compensation
            }

            this.$socket.emit('group', group)
          }, 1000)
        }
      })

      setTimeout(() => {
        let pindex = this.data.broadcast ? 1 : 2
        document.querySelector(`.groupprivacy .button:nth-child(${pindex})`).classList.add('has-background-success')
        document.querySelectorAll('.groupgames .button').forEach(e => {
          let value = parseInt(e.innerHTML)
          e.classList.remove('has-background-success')
          if (this.data.games === value) {
            e.classList.add('has-background-success')
          }
        })
        document.querySelectorAll('.gameclock .button').forEach(e => {
          let value = parseInt(e.innerHTML)
          e.classList.remove('has-background-success')
          if (this.data.minutes === value) {
            e.classList.add('has-background-success')
          }
        })
        document.querySelectorAll('.gamecompensation .button').forEach(e => {
          let value = parseInt(e.innerHTML)
          e.classList.remove('has-background-success')
          if (this.data.compensation === value) {
            e.classList.add('has-background-success')
          }
        })
      }, 50)
    },
    loadGroup () {
      axios.post('/group', {
        id: this.$route.params.group
      }).then((res) => {
        this.$root.loading = false
        this.tried = true
        this.data = res.data
        this.group = {
          group: res.data,
          player: this.player
        }
        this.chatHistory()
        this.$socket.emit('group_join', this.group)
      })
    },
    gameStart (data) {
      console.log('gameStart')
      let t = this
      return new Promise(function (resolve, reject) {
        var pos = 'start'
        var pieces = '/img/chesspieces/cburnett/{piece}.png'

        if (data.fen) {
          pos = data.fen
        }

        if (t.player.pieces) {
          pieces = '/img/chesspieces/' + t.player.pieces + '/{piece}.png'
          t.boardColor = t.player.board
        }

        var cfg = {
          draggable: false,
          position: pos,
          pieceTheme: pieces
        }

        setTimeout(() => {
          t.games[data.id] = new Chess()
          t.boards[data.id] = new Chessboard('board' + data.id, cfg)

          if (data.pgn) {
            t.games[data.id].load_pgn(data.pgn)
          }
          resolve()
        }, 500)
      })
    },
    chatHistory () {
      if (this.data.chat) {
        this.data.chat.forEach(line => {
          const owned = this.player.code === line.sender
          this.chatLines.push({
            text: line.line,
            ts: moment(line.created).fromNow(true),
            sender: line.sender,
            owned: owned
          })
        })
        this.scrollToBottom()
      }
    },
    scrollToBottom () {
      setTimeout(() => {
        const box = document.querySelector('.chatbox-container')
        if (box) {
          box.scrollTop = box.scrollHeight
        }
      }, 50)
    },
    sendChat () {
      let chat = this.chat
      if (chat === '') this.chat = '🤝'
      let line = {
        id: this.$route.params.group,
        sender: this.player.code,
        line: chat
      }
      this.chatLine(line)
      this.$socket.emit('group_chat', line)
      this.chat = ''
    },
    chatLine (line) {
      const owned = this.player.code === line.sender
      this.chatLines.push({
        text: line.line,
        ts: moment(line.created).fromNow(true),
        sender: line.sender,
        owned: owned
      })
      if (!owned) {
        PlaySound('chat.ogg')
      }
      this.scrollToBottom()
    },
    gameMove (data) {
      if (!this.games[data.id]) {
        this.gameStart(data).then(() => {
          this.makeMove(data)
        })
      } else {
        this.makeMove(data)
      }
    },
    makeMove (data) {
      setTimeout(() => {
        var moveObj = ({
          from: data.from,
          to: data.to,
          promotion: 'q' // NOTE: always promote to a queen for example simplicity
        })
        // see if the move is legal
        var move = this.games[data.id].move(moveObj)

        if (move === null) {
          return 'snapback'
        }

        for (var i in this.onlineGames) {
          if (this.onlineGames[i].id === data.id) {
            this.onlineGames[i].wtime = data.wtime
            this.onlineGames[i].btime = data.btime
          }
        }

        this.boards[data.id].position(data.fen)
        this.updateMoves(data.id, move)
      }, 500)
    },
    gameFlip (id) {
      this.boards[id].flip()
      const white = document.querySelector('.board-container.b' + id + ' .white').innerHTML
      const black = document.querySelector('.board-container.b' + id + ' .black').innerHTML
      document.querySelector('.board-container.b' + id + ' .white').innerHTML = black
      document.querySelector('.board-container.b' + id + ' .black').innerHTML = white
      this.highlightLastMove(id)
    },
    updateMoves (id, move) {
      var sound = 'move.mp3'
      var game = this.games[id]
      var data = {}

      for (var i in this.onlineGames) {
        if (this.onlineGames[i].id === id) {
          data = this.onlineGames[i]
        }
      }

      if (game.game_over()) {
        if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
          var message = 'Esta partida finalizó en tablas'
          if (game.in_stalemate()) {
            message = 'Esta partida finalizó en tablas por rey ahogado'
          } else if (game.in_threefold_repetition()) {
            message = 'Esta partida finalizó en tablas por triple repetición'
          }
          document.querySelector('.board-container.b' + id + ' .match-status').innerHTML = message
        } else {
          const winner = game.turn() === 'w' ? data.black : data.white
          document.querySelector('.board-container.b' + id + ' .match-status').innerHTML = winner + ' ganó esta partida'
        }

        sound = 'game-end.mp3'
        game.announced_game_over = true
      } else {
        if (move.flags === 'c') {
          sound = 'capture.mp3'
        }

        if (move.flags === 'k') {
          sound = 'castle.mp3'
        }

        if (move.flags === 'q') {
          sound = 'castle.mp3'
        }

        if (game.in_check() === true) {
          sound = 'check.ogg'
        }

        this.removeHighlight(id)
        this.addHightlight(id, move)
        PlaySound(sound)
      }
    },
    removeHighlight (id) {
      document.getElementById('board' + id).querySelectorAll('.square-55d63').forEach((item) => {
        item.classList.remove('highlight-move')
        item.classList.remove('in-check')
      })
    },
    addHightlight (id, move) {
      var game = this.games[id]
      this.removeHighlight(id)
      if (move) {
        if (game.in_check() === true) {
          document.getElementById('board' + id).querySelector('img[data-piece="' + game.turn() + 'K"]').parentNode.classList.add('in-check')
        }
        setTimeout(function () {
          document.getElementById('board' + id).querySelector('.square-' + move.from).classList.add('highlight-move')
          document.getElementById('board' + id).querySelector('.square-' + move.to).classList.add('highlight-move')
        }, 200)
      }
    },
    highlightLastMove (id) {
      var history = this.games[id].history({ verbose: true })
      if (history.length) {
        var move = history[history.length - 1]
        document.getElementById('board' + id).querySelector('.square-' + move.from).classList.add('highlight-move')
        document.getElementById('board' + id).querySelector('.square-' + move.to).classList.add('highlight-move')
      }
    },
    clickObserve (data) {
      if (data === this.player.code) {
        snackbar('error', 'No podés jugar contra vos mismo')
      } else {
        snackbar('default', data + ' Está en modo Observador y no acepta invitaciones')
      }
    },
    play (player) {
      if (player.code === this.player.code) {
        return snackbar('error', 'No podés jugar contra vos mismo')
      }
      const template = (`
<div class="content">
  <div class="columns columns-bottom is-flex has-text-centered">
    <div class="column">
      <h4>
        <span class="icon">
          <span class="mdi mdi-clock"></span>
        </span>
        <span>Rondas</span>
      </h4>
      <div class="control has-text-centered column">
        <div class="buttons levels has-addons groupgames" title="Nro. partidas de este match">
          <button class="button is-toggle is-rounded has-background-success" title="Match a 1 partida">1</button>
          <button class="button is-toggle" title="Match a 3 partidas">3</button>
          <button class="button is-toggle" title="Match a 5 partidas al match">5</button>
          <button class="button is-toggle" title="Match a 10 partidas">10</button>
          <button class="button is-toggle is-rounded" title="Match a 16 partidas">16</button>
        </div>
      </div>

      <span class="playercolor"><span class="has-background-success is-random-pieces"></span></span>

      <!--div class="control" title="Selecciona el color de tus piezas">
        <div class="buttons levels has-addons playercolor preservefilter">
          <button class="button is-toggle is-large is-rounded has-background-success is-white-pieces" title="Jugar con blancas">
          </button>
          <button class="button is-toggle is-large is-random-pieces" title="Que vaya a sorteo">
          </button>
          <button class="button is-toggle is-large is-rounded is-black-pieces" title="Jugar con negras">
          </button>
        </div>
      </div-->
    </div>
  </div>
  <div class="columns is-flex has-text-centered">
    <div class="column">
      <h4>
        <span class="icon">
          <span class="mdi mdi-clock"></span>
        </span>
        <span>Minutos</span>
      </h4>
      <div class="control has-text-centered column">
        <div class="buttons levels has-addons gameclock" title="Establece la duración de la partida en minutos">
          <button class="button is-toggle is-rounded has-background-success" title="Agregar 3 minutos a la partida">3'</button>
          <button class="button is-toggle" title="Agregar 5 minutos a la partida">5'</button>
          <button class="button is-toggle" title="Agregar 10 minutos a la partida">10'</button>
          <button class="button is-toggle is-rounded" title="Agregar 30 minutos a la partida">30'</button>
        </div>
      </div>
    </div>
  </div>
  <div class="columns is-flex has-text-centered">
    <div class="column">
      <h4>
        <span class="icon">
          <span class="mdi mdi-stopwatch"></span>
        </span>
        <span>Compensación en segundos</span>
      </h4>
      <div class="control has-text-centered column">
        <div class="buttons levels has-addons gamecompensation" title="Agregar compensación por movimiento">
          <button class="button is-toggle is-rounded" title="Jugar sin compensación por movimiento">+0</button>
          <button class="button is-toggle" title="Agregar 1 segundo de compensación por cada movimiento">+1</button>
          <button class="button is-toggle has-background-success" title="Agregar 2 segundos de compensación por cada movimiento">+2</button>
          <button class="button is-toggle is-rounded" title="Agregar 3 segundos de compensación por cada movimiento">+3</button>
        </div>
      </div>
    </div>
  </div>

</div>`)
      swal({
        title: 'Invitar a ' + player.code,
        buttons: ['Cancelar', 'Invitar'],
        closeOnClickOutside: false,
        content: {
          element: 'div',
          attributes: {
            innerHTML: `${template}`
          }
        }
      }).then(accept => {
        if (accept) {
          var playercolor = document.querySelector('.playercolor > .has-background-success')
          var gameclock = document.querySelector('.gameclock > .has-background-success')
          var groupgames = document.querySelector('.groupgames > .has-background-success')
          var gamecompensation = document.querySelector('.gamecompensation > .has-background-success')
          var white = this.player
          var black = player
          var minutes = parseInt(gameclock.textContent)
          var games = parseInt(groupgames.textContent)
          var compensation = parseInt(gamecompensation.textContent)

          if (playercolor.classList.contains('is-black-pieces')) {
            white = player
            black = this.player
          }

          if (playercolor.classList.contains('is-random-pieces')) {
            const coin = Math.floor(Math.random() * 1)
            if (coin) {
              white = player
              black = this.player
            } else {
              white = this.player
              black = player
            }
          }

          swal({
            title: 'Esperando confirmación...',
            text: player.code + ' debe responder la solicitud',
            buttons: false
          })

          let game = {
            asker: this.player,
            player: player,
            white: white,
            black: black,
            minutes: minutes,
            games: games,
            game: 1,
            compensation: compensation
          }

          this.$socket.emit('invite', game)
        }
      })

      setTimeout(() => {
        const saved = JSON.parse(localStorage.getItem('player'))
        let pieces = ['.is-white-pieces', '.is-black-pieces', '.is-random-pieces']
        pieces.forEach(tag => {
          let e = document.querySelector(tag)
          let li = window.getComputedStyle(e)
          e.style.backgroundImage = li.getPropertyValue('background-image').split('cburnett').join(saved.pieces)
        })
      }, 10)
    }
  }
}
</script>
