import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchLevel } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="(level, i) in demonList">
                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="fetchLvl(i); selected = i">
                                <span class="type-label-lg">{{ \`\${level}\` || \`Error\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                    </ul>
                    <h2>Records</h2>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        When submitting your record, please ensure that it complies with the following guidelines: (Submission rules from AREDL)
                    </p>
                    <p>
                        1. Your record must have clicks, COMPLETELY audible throughout the whole level. Not audible sometimes, at the end, or the beginning the whole level. "But what if there was a mistake with the-" We apologize, but we have to be able to hear full audible clicks throughout your video. (Taps, if you're playing on mobile. Same rules apply.)
                    </p>
                    <p>
                        2. Your record must have a cheat indicator on the end screen. If you're playing vanilla GD, or you have a mod menu that does not use a cheat indicator, this is not required. However, you have to put that in your notes, we are not responsible for figuring out which mod menu you used, or if you're playing on vanilla.
                    </p>
                    <p>
                        3. If you are using an LDM or a bugfix copy of a level, it must either be approved by list staff, or not make a difference without a doubt. Use your best judgement here, if you are uncertain whether or not your bugfix copy/LDM of a level can be accepted, file a support ticket with the level ID. However, if you're absolutely certain that your copy is fine, you don't need to get it approved in order to get your record accepted. If you're unaware of what an "acceptable" copy would be, go ahead and file a support ticket. (We deny copies that either change gameplay of the level, or remove so much detail that it makes the level easier.)
                    </p>
                    <p>
                        4. Your record must have an uncut end screen. If your video ends before we see the end screen, and your stats are not visible, it is not an acceptable record.
                    </p>
                    <p>
                        5. Any levels you beat, you must have raw footage. If the level places in the top 1000 then you must also include split audio tracks, submit along with your original record in a downloadable format such as Google Drive. If it was streamed, a VOD on Twitch or Youtube with chat enabled is also allowed. However, if you have the record on your Pointercrate profile, you may submit that in the additional info instead, and we will accept your record. However, please note that we will not accept records that used Physics Bypass while it was allowed on pointercrate, since Physics Bypass was not ever allowed on The Silly List.
                    </p>
                    <p>
                    6. This should be obvious, but your record may not be completed with any disallowed mods. This information (of what we allow and don't allow) can be found on our website. This rule also applies to having a red/blue cheat indicator, obvious hacked completions, and bots.
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        demonList: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        isLoading: false,
        hasLoaded: false
    }),
    computed: {
        level() {
            if (!this.hasLoaded) {
                return [];
            }
            return this.listLevel[0]
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        list() {
            return this.demonList
        },
    },
    async mounted() {
        // Hide loading spinner
        this.demonList = await fetchList();
        this.editors = await fetchEditors();
        this.listLevel = await fetchLevel(this.list[this.selected])
        this.hasLoaded = true;
        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        async fetchLvl(i)
        {
            if (this.isLoading) {
                return;
            }
            this.hasLoaded = false
            this.isLoading = true;
            try {
                console.log(i)
                this.listLevel = await fetchLevel(this.demonList[i])
                if(!this.level) {
                    this.errors = [
                        "Failed to load level"
                    ]
                }
                this.hasLoaded = true;
            } finally {
                this.isLoading = false;
            }
        },
    },
};