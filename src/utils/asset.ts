import path from "path";
import * as fs from 'fs';
import {ipcRenderer} from "electron";
import {area_name, chara_name, unit_name} from "./constants";

interface SourceList {
    events: string
    cards: string
    character2ds: string
    unitStories: string
    eventStories: string
    cardEpisodes: string
    actionSets: string
    specialStories: string
}

function update_source_ai(): SourceList {
    const root: string = "https://api.pjsek.ai/database/master/";
    return {
        events: `${root}events?$limit=1000`,
        cards: `${root}cards?$limit=1000`,
        character2ds: `${root}character2ds?$limit=1000`,
        unitStories: `${root}unitStories?$limit=1000`,
        eventStories: `${root}eventStories?$limit=1000`,
        cardEpisodes: `${root}cardEpisodes?$limit=2000`,
        actionSets: `${root}actionSets?$limit=3000`,
        specialStories: `${root}specialStories?$limit=1000`,
    }
}

function update_source_best(): SourceList {
    const root: string = "https://sekai-world.github.io/sekai-master-db-diff/"
    return {
        events: root + "events.json",
        cards: root + "cards.json",
        character2ds: root + "character2ds.json",
        unitStories: root + "unitStories.json",
        eventStories: root + "eventStories.json",
        cardEpisodes: root + "cardEpisodes.json",
        actionSets: root + "actionSets.json",
        specialStories: root + "specialStories.json",
    }
}

const USER_HOME = process.env.HOME || process.env.USERPROFILE
export const AssetDir: string = process.platform === 'win32'
    ? path.join(String(USER_HOME), 'Documents', 'SekaiSubtitle', "data")
    : path.join(String(USER_HOME), 'SekaiSubtitle', "data")


function download_list(source: string): Promise<any[]> {
    const source_list = source == "ai" ? update_source_ai() : update_source_best()
    const root = path.join(AssetDir, source, "tree")
    if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});

    const axios = require('axios')
    const args = ipcRenderer.sendSync("get-setting", {"ProxyScheme": null, "ProxyHost": null, "ProxyPort": null})

    let allAxios: Promise<any>[] = []
    Object.keys(source_list).forEach(value => {
        allAxios.push(axios.get(source_list[value], {
            proxy: {
                protocol: args['ProxyScheme'].length ? args['ProxyScheme'] : null,
                host: args['ProxyScheme'].length ? args['ProxyHost'] : null,
                port: args['ProxyScheme'].length ? args["ProxyPort"] : null
            },
        }))
    })
    return axios.all(allAxios)
        .then(axios.spread((
            events, cards, character2ds, unitStories, eventStories, cardEpisodes, actionSets, specialStories
        ) => {
            fs.writeFileSync(path.join(root, `events.json`), JSON.stringify(events['data']))
            fs.writeFileSync(path.join(root, `cards.json`), JSON.stringify(cards['data']))
            fs.writeFileSync(path.join(root, `character2ds.json`), JSON.stringify(character2ds['data']))
            fs.writeFileSync(path.join(root, `unitStories.json`), JSON.stringify(unitStories['data']))
            fs.writeFileSync(path.join(root, `eventStories.json`), JSON.stringify(eventStories['data']))
            fs.writeFileSync(path.join(root, `cardEpisodes.json`), JSON.stringify(cardEpisodes['data']))
            fs.writeFileSync(path.join(root, `actionSets.json`), JSON.stringify(actionSets['data']))
            fs.writeFileSync(path.join(root, `specialStories.json`), JSON.stringify(specialStories['data']))
        }))
}

function update_tree(source: string) {
    const root = path.join(AssetDir, source, "tree")
    let character2ds = {};
    const character2ds_data = fs.existsSync(path.join(root, "character2ds.json")) ?
        JSON.parse(fs.readFileSync(path.join(root, "character2ds.json")).toString()) : []
    character2ds_data.forEach((value) => {
        character2ds[value['id']] = value
    })
    let events = {};
    const events_data = fs.existsSync(path.join(root, "events.json")) ?
        JSON.parse(fs.readFileSync(path.join(root, "events.json")).toString()) : []
    events_data.forEach((value) => {
        events[value['id']] = value
    })
    let cards = {};
    const cards_data = fs.existsSync(path.join(root, "cards.json")) ?
        JSON.parse(fs.readFileSync(path.join(root, "cards.json")).toString()) : []
    cards_data.forEach((value) => {
        cards[value['id']] = value
    })
    let tree = fs.existsSync(path.join(root, "tree.json")) ?
        JSON.parse(fs.readFileSync(path.join(root, "tree.json")).toString()) : {}


    if (fs.existsSync(path.join(root, "cardEpisodes.json")) && Boolean(Object.keys(cards).length)) {
        let data: Object[] = JSON.parse(fs.readFileSync(path.join(root, "cardEpisodes.json")).toString())
        tree['卡牌剧情'] = {};
        data.forEach(episode => {
            if (!episode.hasOwnProperty("scenarioId")) return;
            let card_id = episode['cardId'];
            let card: Object | null = cards[episode['cardId']];
            if (card === null) return;
            let chara: string = chara_name[card['characterId']];
            let rarity: string = `★${card['cardRarityType'].substring(7).toUpperCase()}`;
            let prefix: string = card['prefix'];
            let section: string = episode['cardEpisodePartType'] == "first_part" ? "前篇" : "后篇"
            let url = source == "ai"
                ? `https://assets.pjsek.ai/file/pjsekai-assets/startapp/character/member/${episode['assetbundleName']}/${episode['scenarioId']}.json`
                : `https://storage.sekai.best/sekai-assets/character/member/${episode['assetbundleName']}_rip/${episode['scenarioId']}.asset`
            let d = (tree['卡牌剧情'].hasOwnProperty(chara)) ? tree['卡牌剧情'][chara] : {};
            d[`${card_id} - ${rarity} ${prefix} ${section}`] = url
            tree['卡牌剧情'][chara] = d
        })
    }
    if (fs.existsSync(path.join(root, "eventStories.json")) && Boolean(Object.keys(events).length)) {
        let data: Object[] = JSON.parse(fs.readFileSync(path.join(root, "eventStories.json")).toString())
        tree['活动剧情'] = {}
        data.reverse().forEach(storySet => {
            let event_id: number = storySet['eventId'];
            let event: object = events[event_id];
            let event_name: string = (events != null)
                ? `${event_id.toFixed().padStart(3, '0')}: ${event['name']}`
                : `${event_id.toFixed().padStart(3, '0')}: 未知活动`;
            let event_ep = {};
            storySet["eventStoryEpisodes"].forEach(episode => {
                event_ep[`${episode['episodeNo']}: ${episode['title']}`] = source == 'best'
                    ? `https://storage.sekai.best/sekai-assets/event_story/${storySet['assetbundleName']}/scenario_rip/${episode['scenarioId']}.asset`
                    : `https://assets.pjsek.ai/file/pjsekai-assets/ondemand/event_story/${storySet['assetbundleName']}/scenario/${episode['scenarioId']}.json`
            })
            tree['活动剧情'][event_name] = event_ep
        })
    }
    if (fs.existsSync(path.join(root, "unitStories.json"))) {
        let data: Object[] = JSON.parse(fs.readFileSync(path.join(root, "unitStories.json")).toString())
        tree['主线剧情'] = {}
        data.forEach(unit => {
            unit['chapters'].forEach(chapters => {
                let episodeData = {}
                chapters["episodes"].forEach(episodes => {
                    let key = `${episodes['episodeNoLabel']}: ${episodes['title']}`
                    episodeData[key] = source == "ai"
                        ? `https://assets.pjsek.ai/file/pjsekai-assets/startapp/scenario/unitstory/${chapters['assetbundleName']}/${episodes['scenarioId']}.json`
                        : `https://storage.sekai.best/sekai-assets/scenario/unitstory/${chapters['assetbundleName']}_rip/${episodes['scenarioId']}.asset`
                })
                tree['主线剧情'][chapters['title']] = episodeData
            })
        })
    }
    if (fs.existsSync(path.join(root, "specialStories.json"))) {
        let data: Object[] = JSON.parse(fs.readFileSync(path.join(root, "specialStories.json")).toString())
        tree['特殊剧情'] = {}
        data.forEach(period => {
            let title = period["title"]
            let titleData = {}
            period['episodes'].forEach(episode => {
                let ep_title = episode['title']
                titleData[ep_title] = source == "best"
                    ? `https://storage.sekai.best/sekai-assets/scenario/special/${episode['assetbundleName']}_rip/${episode['scenarioId']}.asset`
                    : `https://assets.pjsek.ai/file/pjsekai-assets/startapp/scenario/special/${episode['assetbundleName']}/${episode['scenarioId']}.json`
            })
            tree['特殊剧情'][title] = titleData
        })
    }
    if (fs.existsSync(path.join(root, "actionSets.json")) && Boolean(Object.keys(character2ds).length) && Boolean(Object.keys(events).length)) {
        let data: Object[] = JSON.parse(fs.readFileSync(path.join(root, "actionSets.json")).toString())
        tree['地图对话 - 地点筛选'] = {};
        tree['地图对话 - 人物筛选'] = {};
        tree['地图对话 - 活动追加'] = {};
        tree['地图对话 - 月度追加'] = {};
        let as_count = 0;
        let as_count_sp = 0;
        data.forEach(ep => {
            if (ep["scenarioId"] == null) return;
            let area: string = area_name[ep['areaId']]
            let group: number = parseInt(String(ep["id"] / 100))
            let scenario_id: string = ep['scenarioId']
            let chara_string: string[] = ep['characterIds'].map(cid => chara_name[character2ds[cid]['characterId']]).filter(x => x != null)
            let chara: string = chara_string.join(',')
            let as_id;
            if (ep["actionSetType"] == "normal") {
                as_count += 1
                as_id = `${String(as_count).padStart(4, '0')} - ${chara} - id${ep['id']}`
            } else {
                as_count_sp += 1
                as_id = `S${String(as_count_sp).padStart(3, '0')} - ${chara} - id${ep['id']}`
            }
            let url = source == "ai"
                ? `https://assets.pjsek.ai/file/pjsekai-assets/startapp/scenario/actionset/group${group}/${scenario_id}.json`
                : `https://storage.sekai.best/sekai-assets/scenario/actionset/group${group}_rip/${scenario_id}.asset`
            if (scenario_id.includes("monthly")) {
                let date = scenario_id.split("_")[1].replaceAll("monthly", "")
                let key = `${date.substring(0, 2)}年${date.substring(2, 4)}月`
                let d = tree['地图对话 - 月度追加'][key] == null ? {} : tree['地图对话 - 月度追加'][key]
                d[as_id] = url
                tree['地图对话 - 月度追加'][key] = d
            }
            if (scenario_id.includes('ev')) {
                let release_event_id = ep['releaseConditionId']
                if (release_event_id > 100000) {
                    release_event_id = parseInt(String((release_event_id % 10000) / 100)) + 1
                }
                let unit = unit_name[scenario_id.split("_")[2]]
                let key = (events[release_event_id] != null)
                    ? `${String(release_event_id).padStart(3, '0')}: ${events[release_event_id]['name']} - ${unit}`
                    : `${String(release_event_id).padStart(3, '0')}: 未知活动 - ${unit}`
                let d = tree['地图对话 - 活动追加'][key] == null ? {} : tree['地图对话 - 活动追加'][key]
                d[as_id] = url
                tree['地图对话 - 活动追加'][key] = d

            }

            {
                let d = tree['地图对话 - 地点筛选'][area] == null ? {} : tree['地图对话 - 地点筛选'][area]
                d[as_id] = url
                tree['地图对话 - 地点筛选'][area] = d
            }

            chara_string.forEach(chara => {
                let d = tree['地图对话 - 人物筛选'][chara] == null ? {} : tree['地图对话 - 人物筛选'][chara]
                d[as_id] = url
                tree['地图对话 - 人物筛选'][chara] = d
            })

        })
    }
    if (Object.keys(tree).length) fs.writeFileSync(path.join(root, "tree.json"), JSON.stringify(tree))
    return tree
}

export {update_tree, download_list}

