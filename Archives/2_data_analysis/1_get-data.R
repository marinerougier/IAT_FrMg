###############################################################################
#                                                                             #
#                                                                             #
#                                                                             #
###############################################################################
# TODO: 
# Faire en sorte que les credential soient lus depuis un fichier externe pour
# que le fichier .js et ce script utilisent les mêmes infos. 
# 
# Packages --------------------------------------------------------------------
library(reticulate)
library(tidyverse)
library(jsonlite)
library(writexl)

# importing keen.io python api ------------------------------------------------
keen_library <- import("keen.client")

keen_client <- keen_library$KeenClient(
  project_id = "5b154352c9e77c0001524622",
  read_key   = "7285DA744D9DA29F6E841520A00AA88D2CBE89B1D76B0CB06B2D96C82FDBA47EB144A51CB9563061A892AAF1C74D1BBF565B8C1631FC3421C8011FDF4EAE7E021A4F8F95A4D07D0E5728FE46B4A9BCCF6DB6DDD8E46094C3398CF38FDA5AB162"
)

# vaast dataset ---------------------------------------------------------------
keen_vaast_trial   <- 
  keen_client$extraction(event_collection = "stream_vaast_trial",
                         timeframe        = "this_month")

vaast_dataset_tidy <- 
  keen_vaast_trial %>% 
  map_df(~data_frame(participant_id = .x$session_id,
                     condition      = .x$experimental_condition,
                     vaast_trial_raw = .x$vaast_trial_data)) %>% 
  mutate(id = row_number(),
         vaast_trial = map(vaast_trial_raw, ~fromJSON(.x))) %>% 
  unnest() %>% 
  select(-vaast_trial_raw) %>% 
  group_by(id) %>%
  mutate(soa = duration[1]) %>% 
  filter(row_number() == 2) %>%  
  ungroup() %>% 
  select(-internal_node_id,
         -trial_type,
         -id,
         -position,
         -trial_index,
         -duration)

dataset_tidy %>% 
  write_xlsx("data/dataset.xlsx")

# session dataset -------------------------------------------------------------
keen_vaast_raw   <- 
  keen_client$extraction(event_collection = "stream_vaast_trial",
                         timeframe        = "this_month")

vaast_dataset_tidy <- 
  keen_vaast_raw %>% 
  map_df(~data_frame(participant_id = .x$session_id,
                     condition      = .x$experimental_condition,
                     vaast_trial_raw = .x$vaast_trial_data)) %>% 
  mutate(id = row_number(),
         vaast_trial = map(vaast_trial_raw, ~fromJSON(.x))) %>% 
  unnest() %>% 
  select(-vaast_trial_raw) %>% 
  group_by(id) %>%
  mutate(soa = duration[1]) %>% 
  filter(row_number() == 2) %>%  
  ungroup() %>% 
  select(-internal_node_id,
         -trial_type,
         -id,
         -position,
         -trial_index,
         -duration)

vaast_dataset_tidy %>% 
  write_csv("data/vaast_dataset.csv")

# browser info ----------------------------------------------------------------
browser_info_raw   <- 
  keen_client$extraction(event_collection = "stream_browser_info",
                         timeframe        = "this_month")
browser_info_tidy <-
  browser_info_raw %>% 
  map_df(~data_frame(participant_id = .x$session_id,
                     user_agent     = .x$user_agent,
                     timestamp      = .x$keen$timestamp,
                     res_height     = .x$res_height,
                     res_width      = .x$res_width) ) %>% 
  unnest()
  
browser_info_tidy %>% 
  write_csv("data/browser_info_dataset.csv")

# browser events --------------------------------------------------------------
browser_event_raw   <- 
  keen_client$extraction(event_collection = "stream_browser_event",
                         timeframe        = "this_month")
browser_event_tidy <-
  browser_event_raw %>% 
  map_df(~data_frame(participant_id = .x$session_id,
                     timestamp      = .x$keen$timestamp,
                     completion     = .x$completion,
                     event_raw      = .x$event_data)) %>% 
    mutate(timestamp = lubridate::ymd_hms(timestamp)) %>% 
    group_by(participant_id) %>% 
    filter(timestamp == max(timestamp)) %>% 
    ungroup() %>% 
    mutate(event_data = map(event_raw, ~fromJSON(.x))) %>% 
    select(-event_raw) %>% 
    unnest()

browser_event_tidy %>% 
  write_csv("data/browser_event_dataset.csv")


# demographics ------------------------------------------------------------
demographics_raw   <- 
  keen_client$extraction(event_collection = "stream_demographics",
                         timeframe        = "this_month")

questions <-
  tribble(~question_id, ~question,
          1L, "age",
          2L, "sex",
          3L, "handedness",
          4L, "language")

demographics_tidy <-
  demographics_raw %>% 
  map_df(~data_frame(participant_id   = .x$session_id,
                     demographics_raw = .x$demographics_data)) %>% 
  mutate(demogrphics_data = map(demographics_raw, ~fromJSON(.x))) %>% 
  unnest() %>%
  select(participant_id,
         time_elapsed,
         responses) %>% 
  mutate(response = map(responses, ~fromJSON(.x))) %>% 
  select(-responses) %>% 
  # I don't really know why we have to call unnest twice, but it works.
  unnest() %>% 
  unnest() %>% 
  group_by(participant_id) %>% 
  mutate(question_id = row_number()) %>% 
  ungroup() %>% 
  left_join(questions) %>% 
  reshape2::dcast(participant_id ~ question,
                  value.var = "response")

demographics_tidy %>% 
  write_csv("data/demographics_dataset.csv")
