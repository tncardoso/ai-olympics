import type { PageLoad } from './$types';
import type { Replay } from '$lib/guesswho/replay';

export const load: PageLoad = async ({ fetch, params }) => {
	const response = await fetch(`/guesswho/replays.json`);
    if (!response.ok) {
        throw new Error('Failed to load JSON data');
    }
    const data = await response.json() as Array<Replay>;
    return data;
};