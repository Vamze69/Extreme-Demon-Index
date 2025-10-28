import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchLevel, fetchRecords } from "../content.js";

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
                        <tr v-for="record in recordList[level.name].records" class="record">
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
                        When submitting your record, please ensure that it complies with the following guidelines:
                    </p>
                    <p>
                        1. Your recording must have clicks that are clearly audible throughout the entire level (Or at the very least most of it). The clicks must be consistent and fully audible from beginning to end. If there was an issue with the audio, we apologize, but we can only accept records where the clicks (or taps, if you are playing on mobile) are clearly audible for the entire duration of the level. Unless you are able to provide us raw footage, then it will be rejected most likely.
                    </p>
                    <p>
                        2. Your recording must include a cheat indicator on the end screen. If you are playing on vanilla GD or using a mod menu that does not feature a cheat indicator, this requirement does not apply. However, you must specify this in your notes, as we are not responsible for determining which mod menu you used or whether you were playing on vanilla.
                    </p>
                    <p>
                        3. If you are using an LDM or a bugfix copy of a level, it must either be approved by list staff or clearly make no difference to the gameplay. Use your best judgment, if you are unsure whether your bugfix copy or LDM is acceptable, please ask staff and include the level ID. If you are completely certain that your copy is acceptable, approval is not required for your record to be accepted. If you are unsure what qualifies as an “acceptable” copy, you should also ask staff. Copies that alter gameplay or remove so much detail that the level becomes easier will be denied.
                    </p>
                    <p>
                        4. Your recording must include an uncut end screen. If the video ends before the end screen is shown or your stats are not visible, the record will not be accepted.
                    </p>
                    <p>
                        5. It is recommended that you keep raw footage of any levels you complete. If the level places within the top 500, raw footage is required and must include split audio tracks. Submit this along with your original record in a downloadable format, such as Google Drive. If the record was streamed, a Twitch or YouTube VOD with chat enabled is also acceptable. Alternatively, if the record is listed on your Pointercrate profile, you may include that link in the additional information section, and your record will be accepted.
                    </p>
                    <p>
                    6. This should be self-explanatory, but your record must not be completed using any disallowed mods. This rule also applies to records showing a red cheat indicator, clearly hacked completions, or the use of bots.
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        demonList: [],
        recordList: {},
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
        records() {
            return this.recordList
        }
    },
    async mounted() {
        // Hide loading spinner
        this.demonList = await fetchList();
        this.recordList = await fetchRecords();
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