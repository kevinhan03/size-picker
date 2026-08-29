-- Five-axis cluster artifacts cannot be reused with the eight-axis impression
-- space. Delete every stored model, centroid, and per-product score so future
-- training starts from a clean dataset.
delete from public.style_cluster_model_versions;

update public.products
set style_cluster_score_status = 'pending',
    style_cluster_score_error = null;
