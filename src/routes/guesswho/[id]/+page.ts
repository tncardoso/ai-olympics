import { error } from '@sveltejs/kit';
import { base } from "$app/paths";
import type { PageLoad } from './$types';
import type { Replay } from '$lib/guesswho/replay';

export const load: PageLoad = async ({ fetch, params }) => {
	const response = await fetch(`${base}/guesswho/runs/${params.id}.json`);
    if (!response.ok) {
        throw new Error('Failed to load JSON data');
    }
    const data = await response.json() as Replay;
    return data;
};