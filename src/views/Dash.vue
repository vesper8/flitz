<template>
  <div class="container is-widescreen">
    <div class="content column fadeIn">
      <h3>
        <span class="icon has-margin">
          <span class="mdi mdi-view-list"></span>
        </span>
        <span>{{ 'dashboard' | t }}</span>
      </h3>
      <form @submit.prevent="submit">
        <div class="field has-addons">
          <div class="control">
            <input ref="input" @keyup="inputTrigger" v-model="query" class="input is-rounded is-success" type="text" placeholder="Evento, lugar, fecha, jugador o PGN" autofocus>
          </div>
          <div class="control">
            <button v-show="this.searching" type="button" @click="clear" class="button is-rounded is-danger">
              <span class="icon has-margin">
                <span class="mdi mdi-close"></span>
              </span>
            </button>
            <button v-show="!this.searching" type="submit" id="searchbtn" class="button is-rounded is-success">
              <span class="icon has-margin">
                <span class="mdi mdi-magnify"></span>
              </span>
            </button>
          </div>
        </div>
      </form>
      <div v-if="data.count" class="has-text-left">
        <table class="table is-narrow is-striped is-fullwidth">
          <thead>
            <th>Mesa</th>
            <th>Evento</th>
            <th>Blancas</th>
            <th>Negras</th>
            <th>Fecha</th>
            <th>Plys</th>
          </thead>
          <tbody>
            <tr v-for="(item, index) in data.games" :key="index">
              <td>
                <router-link :to="'/game/'+item._id">
                  <span class="icon">
                    <span class="mdi mdi-chess-king"></span>
                  </span>
                </router-link>
              </td>
              <td>
                <span v-html="item.event"></span>
              </td>
              <td>
                <span v-show="item.result==='1-0'" class="mdi mdi-trophy is-size-7 has-text-warning"></span>
                <span v-show="item.result==='1/2-1/2'" class="mdi mdi-handshake has-text-success"></span>
                <span v-if="item.whiteflag" class="icon has-margin">
                  <span v-html="item.whiteflag"></span>
                </span>
                <span v-html="item.white"></span>
              </td>
              <td>
                <span v-show="item.result==='0-1'" class="mdi mdi-trophy is-size-7 has-text-warning"></span>
                <span v-show="item.result==='1/2-1/2'" class="mdi mdi-handshake has-text-success"></span>
                <span v-if="item.blackflag" class="icon has-margin">
                  <span v-html="item.blackflag"></span>
                </span>
                <span v-html="item.black"></span>
              </td>
              <td>
                <span v-html="item.date"></span>
              </td>
              <td>
                <span v-html="$root.countMoves(item.pgn)"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <nav class="pagination is-centered is-rounded" role="navigation" aria-label="pagination">
      <!--a class="pagination-previous">Previous</a>
      <a class="pagination-next">Next page</a-->
      <ul class="pagination-list">
        <li v-for="(page, index) in pages" :key="index">
          <router-link :to="'?q=' + query + '&offset=' + page" class="pagination-link" :class="{'is-current': offset == page}" :title="'Ir a página ' + parseInt(page / limit + 1)"></router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>

import axios from 'axios'
import snackbar from '../components/Snackbar'
export default {
  name: 'results',
  watch: {
    '$route': function () {
      this.triggerSearch()
    }
  },
  mounted: function () {
    this.query = this.$route.query.q || ''
    this.triggerSearch()
  },
  methods: {
    inputTrigger: function () {
      if (this.interval) clearInterval(this.interval)
      this.interval = setTimeout(() => {
        this.$router.push({ path: 'results', query: { q: this.query } })
      }, 1500)
    },
    clear: function () {
      this.query = ''
      this.submit()
    },
    triggerSearch: function () {
      if (this.$route.query.offset) {
        this.offset = parseInt(this.$route.query.offset)
      }
      // this.$nextTick(() => this.$refs.input.focus())
      this.search()
    },
    search: function () {
      this.$root.loading = true
      this.searching = this.$route.query.length || false
      axios.post('/dash/games', {
        code: this.player.code,
        query: this.query,
        offset: this.offset,
        limit: this.limit,
        strict: this.$route.query.strict
      }).then((res) => {
        this.data = res.data
        let t = this.$root.t
        var pages = []
        if (res.data.error) {
          if (res.data.error === 'not_enough_params') {
            snackbar('info', this.$root.t('results_toast'), 15000)
          }
        } else {
          if (res.data.count === 0) {
            snackbar('danger', t('results_nomatch'), 5000)
          } else {
            var numPages = Math.ceil(res.data.count / this.limit)
            for (var i = 0; i < numPages; i++) {
              pages[i] = i * this.limit
            }
            snackbar('success', t('results_found') + this.data.count + (this.data.count > 1 ? t('games') : t('game')) + '.' + t('showing_results') + (this.offset + 1) + t('of') + (this.offset + this.limit > this.data.count ? this.data.count : this.offset + this.limit), 5000)
          }
        }

        let max = 20

        if (pages.length > max) {
          pages.splice(max / 2, pages.length - max)
        }

        this.pages = pages
        this.$root.loading = false
      })
    },
    submit: function () {
      this.$router.push('/results?q=' + this.query.trim())
    }
  },
  data () {
    return {
      data: { count: 0, games: [] },
      pages: {},
      searching: false,
      query: '',
      limit: 10,
      offset: 0,
      msg: 'Results'
    }
  }
}
</script>
