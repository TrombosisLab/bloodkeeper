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

];
