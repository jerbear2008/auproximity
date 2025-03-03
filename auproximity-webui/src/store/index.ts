import Vue from 'vue'
import Vuex from 'vuex'

import { BackendModel, BackendType } from '@/models/BackendModel'
import { ClientModel, ColorID, MyMicModel, PlayerFlag, PlayerPose } from '@/models/ClientModel'

import { ClientSocketEvents } from '@/models/ClientSocketEvents'
import { HostOptions, ClientOptions, GameState, GameFlag } from '@/models/RoomModel'

Vue.config.devtools = true
Vue.use(Vuex)

const state: State = {
  micAllowed: true,
  joinedRoom: false,
  backendModel: {
    gameCode: '',
    backendType: BackendType.NoOp
  },
  mic: {
    volumeNode: undefined,
    destStream: undefined,
    levels: 0
  },
  globalGainNode: undefined,
  muted: false,
  deafened: false,
  me: {
    uuid: '',
    name: '',
    position: {
      x: 0,
      y: 0
    },
    color: -1,
    flags: PlayerFlag.None,
    ventid: -1
  },
  clients: [],
  options: {
    falloff: 4.5,
    falloffVision: false,
    colliders: false,
    paSystems: true,
    commsSabotage: true,
    meetingsCommsSabotage: true
  },
  clientOptions: {
    omniscientGhosts: false
  },
  gameState: GameState.Lobby,
  gameFlags: GameFlag.None,
  host: ''
}
export default new Vuex.Store({
  state,
  mutations: {
    setUuid (state: State, payload: string) {
      state.me.uuid = payload
    },
    addClient (state: State, client: ClientModel) {
      state.clients.push(client)
    },
    setAllClients (state: State, clients: ClientModel[]) {
      state.clients = clients
    },
    removeClient (state: State, uuid: string) {
      state.clients = state.clients.filter(c => c.uuid !== uuid)
    },
    setPosition (state: State, position: PlayerPose) {
      state.me.position = position
    },
    setPositionOf (state: State, payload: { uuid: string; position: PlayerPose }) {
      const index = state.clients.findIndex(c => c.uuid === payload.uuid)

      if (index !== -1) {
        state.clients[index].position = payload.position
      }
    },
    setVent (state: State, ventid: number) {
      state.me.ventid = ventid
    },
    setVentOf (state: State, payload: { uuid: string; ventid: number }) {
      const index = state.clients.findIndex(c => c.uuid === payload.uuid)

      if (index !== -1) {
        state.clients[index].ventid = payload.ventid
      }
    },
    setColor (state: State, color: ColorID) {
      state.me.color = color
    },
    setColorOf (state: State, payload: { uuid: string; color: ColorID }) {
      const index = state.clients.findIndex(c => c.uuid === payload.uuid)

      if (index !== -1) {
        state.clients[index].color = payload.color
      }
    },
    setFlags (state: State, flags: PlayerFlag) {
      state.me.flags = flags
    },
    setFlagsOf (state: State, payload: { uuid: string; flags: PlayerFlag }) {
      const index = state.clients.findIndex(c => c.uuid === payload.uuid)

      if (index !== -1) {
        state.clients[index].flags = payload.flags
      }
    },
    setJoinedRoom (state: State, payload: boolean) {
      state.joinedRoom = payload
    },
    setNameAndBackendModel (state: State, payload: { name: string; backendModel: BackendModel }) {
      state.me.name = payload.name
      state.backendModel = payload.backendModel
    },
    setHost (state: State, payload: { name: string }) {
      state.host = payload.name
    },
    setOptions (state: State, payload: { options: HostOptions }) {
      state.options = payload.options
    },
    setGameState (state: State, payload: { state: GameState }) {
      state.gameState = payload.state
    },
    setGameFlags (state: State, payload: { flags: number }) {
      state.gameFlags = payload.flags
    }
  },
  actions: {
    destroyConnection ({ commit }) {
      commit('setUuid', '')
      commit('setJoinedRoom', false)
      commit('setNameAndBackendModel', {
        name: '',
        backendModel: {
          gameCode: '',
          backendType: BackendType.NoOp
        }
      })
    },
    [`socket_${ClientSocketEvents.Error}`] ({ dispatch }, payload: { fatal: boolean }) {
      if (payload.fatal) dispatch('destroyConnection')
    },
    [`socket_${ClientSocketEvents.Disconnect}`] ({ dispatch }) {
      dispatch('destroyConnection')
    },
    [`socket_${ClientSocketEvents.SetUuid}`] ({ commit }, uuid: string) {
      commit('setUuid', uuid)
    },
    [`socket_${ClientSocketEvents.AddClient}`] ({ commit }, payload: ClientModel) {
      const client: ClientModel = {
        uuid: payload.uuid,
        name: payload.name,
        position: payload.position,
        color: payload.color,
        flags: payload.flags,
        ventid: payload.ventid
      }
      commit('addClient', client)
    },
    [`socket_${ClientSocketEvents.SyncAllClients}`] ({ commit }, payload: ClientModel[]) {
      const clients: ClientModel[] = payload.map(c => ({
        uuid: c.uuid,
        name: c.name,
        position: c.position,
        color: c.color,
        flags: c.flags,
        ventid: c.ventid
      }))
      commit('setAllClients', clients)
    },
    [`socket_${ClientSocketEvents.RemoveClient}`] ({ commit }, uuid: string) {
      commit('removeClient', uuid)
    },
    [`socket_${ClientSocketEvents.SetPositionOf}`] ({ commit, state }, payload: { uuid: string; position: PlayerPose }) {
      if (payload.uuid === state.me.uuid) {
        commit('setPosition', payload.position)
      } else {
        commit('setPositionOf', { uuid: payload.uuid, position: payload.position })
      }
    },
    [`socket_${ClientSocketEvents.SetVentOf}`] ({ commit, state }, payload: { uuid: string; ventid: number }) {
      if (payload.uuid === state.me.uuid) {
        commit('setVent', payload.ventid)
      } else {
        commit('setVentOf', { uuid: payload.uuid, venstid: payload.ventid })
      }
    },
    [`socket_${ClientSocketEvents.SetColorOf}`] ({ commit, state }, payload: { uuid: string; color: ColorID }) {
      if (payload.uuid === state.me.uuid) {
        commit('setColor', payload.color)
      } else {
        commit('setColorOf', { uuid: payload.uuid, color: payload.color })
      }
    },
    [`socket_${ClientSocketEvents.SetHost}`] ({ commit }, payload: { name: string }) {
      commit('setHost', { name: payload.name })
    },
    [`socket_${ClientSocketEvents.SetOptions}`] ({ commit }, payload: { options: HostOptions }) {
      commit('setOptions', { options: payload.options })
    },
    [`socket_${ClientSocketEvents.SetGameState}`] ({ commit }, payload: { state: GameState }) {
      commit('setGameState', { state: payload.state })
    },
    [`socket_${ClientSocketEvents.SetGameFlags}`] ({ commit }, payload: { flags: number }) {
      commit('setGameFlags', { flags: payload.flags })
    },
    [`socket_${ClientSocketEvents.SetFlagsOf}`] ({ commit, state }, payload: { uuid: string; flags: PlayerFlag }) {
      if (payload.uuid === state.me.uuid) {
        commit('setFlags', payload.flags)
      } else {
        commit('setFlagsOf', { uuid: payload.uuid, flags: payload.flags })
      }
    }
  },
  modules: {
  }
})
export interface State {
  micAllowed: boolean;
  joinedRoom: boolean;
  backendModel: {
    gameCode: string;
    backendType: BackendType;
  };
  mic: MyMicModel;
  globalGainNode: GainNode|undefined;
  muted: boolean;
  deafened: boolean;
  me: ClientModel;
  clients: ClientModel[];
  options: HostOptions;
  clientOptions: ClientOptions;
  gameState: GameState;
  gameFlags: number;
  host: string;
}
