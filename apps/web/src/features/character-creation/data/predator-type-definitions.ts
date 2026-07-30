import type { PredatorTypeDefinition } from '../types/predator-type.types.ts';

export const predatorTypeDefinitions: PredatorTypeDefinition[] = [

{
    key: 'bagger',

    name: 'Bolsero',

    restrictions: {
        excludedClans: ['ventrue'],
    },

    fixedGrants: {
        advantages: [
            {
                definitionKey: 'iron-stomach',
                category: 'merit',
                rating: 3,
            },
            {
                definitionKey: 'enemy',
                category: 'flaw',
                rating: 2,
            },
        ],
    },

    pendingReferences: [
        {
            definitionKey: 'enemy',
        },
    ],

    choices: [

        {
            id: 'bagger-specialty',

            minimumSelections: 1,
            maximumSelections: 1,

            options: [

                {
                    grant: {
                        type: 'specialty',
                        skillKey: 'larceny',
                        name: 'Forzar Cerraduras',
                    },
                },

                {
                    grant: {
                        type: 'specialty',
                        skillKey: 'streetwise',
                        name: 'Mercado Negro',
                    },
                },

            ],
        },

        {
            id: 'bagger-discipline',

            minimumSelections: 1,
            maximumSelections: 1,

            options: [

                {
                    when: {
                        clan: 'tremere',
                    },

                    grant: {
                        type: 'discipline',
                        disciplineKey: 'bloodSorcery',
                        dots: 1,
                    },
                },

                {
                    grant: {
                        type: 'discipline',
                        disciplineKey: 'obfuscate',
                        dots: 1,
                    },
                },

            ],
        },

    ],

    tags: [
        'criminal',
        'institutional',
    ],
},


{
    key: 'osiris',

    name: 'Osiris',

    fixedGrants: {
        pointDistributions: [
            {
                type: 'pointDistribution',
                points: 3,
                options: [
                    {
                        definitionKey: 'fame',
                        category: 'background',
                    },
                    {
                        definitionKey: 'herd',
                        category: 'background',
                    },
                ],
            },
            {
                type: 'pointDistribution',
                points: 2,
                options: [
                    {
                        definitionKey: 'enemy',
                        category: 'flaw',
                    },
                    {
                        family: 'mythic-flaw',
                        category: 'flaw',
                    },
                ],
            },
        ],
    },

    choices: [
        {
            id: 'osiris-specialty',
            minimumSelections: 1,
            maximumSelections: 1,

            options: [
                {
                    grant: {
                        type: 'specialty',
                        skillKey: 'occult',
                        name: 'Tradición específica',
                    },
                },
                {
                    grant: {
                        type: 'specialty',
                        skillKey: 'performance',
                        name: 'Campo de entretenimiento específico',
                    },
                },
            ],
        },
        {
            id: 'osiris-discipline',
            minimumSelections: 1,
            maximumSelections: 1,

            options: [
                {
                    when: {
                        clan: 'tremere',
                    },
                    grant: {
                        type: 'discipline',
                        disciplineKey: 'bloodSorcery',
                        dots: 1,
                    },
                },
                {
                    grant: {
                        type: 'discipline',
                        disciplineKey: 'presence',
                        dots: 1,
                    },
                },
            ],
        },
    ],

    tags: [
        'cult',
        'fame',
        'followers',
    ],
},


{
    key: 'sandman',

    name: 'Sandman',

    fixedGrants: {
        advantages: [
            {
                definitionKey: 'resources',
                category: 'background',
                rating: 1,
            },
        ],
    },

    choices: [
        {
            id: 'sandman-specialty',

            minimumSelections: 1,
            maximumSelections: 1,

            options: [
                {
                    grant: {
                        type: 'specialty',
                        skillKey: 'medicine',
                        name: 'Anestesia',
                    },
                },
                {
                    grant: {
                        type: 'specialty',
                        skillKey: 'stealth',
                        name: 'Entradas silenciosas',
                    },
                },
            ],
        },

        {
            id: 'sandman-discipline',

            minimumSelections: 1,
            maximumSelections: 1,

            options: [
                {
                    when: {
                        clan: 'tremere',
                    },

                    grant: {
                        type: 'discipline',
                        disciplineKey: 'bloodSorcery',
                        dots: 1,
                    },
                },

                {
                    grant: {
                        type: 'discipline',
                        disciplineKey: 'obfuscate',
                        dots: 1,
                    },
                },
            ],
        },
    ],

    tags: [
        'sleep',
        'intrusion',
    ],
},

];
