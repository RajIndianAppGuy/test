import { supabase } from "../utils/SupabaseClient.js";

export async function checkEmbaddingExists(url) {
  try {
    const { data, error } = await supabase
      .from("ms_text_info")
      .select("*")
      .eq("url", url)

    console.log(data)

    if (data?.length === 0) {
      return null;
    }

    if (error) {
      console.log("Supabase Slug Checking Internal Error: ", error);
      return null;
    }

    return data;
  } catch (error) {
    console.log("Supabase Slug Checking Error: ", error);
    return null;
  }
}

export async function storeEmbadding(supabaseInput) {
  // Store embadding in supabase
  try {
    const { data, error } = await supabase
      .from("ms_documents")
      .insert(supabaseInput);

    if (error) {
      console.log("Supabase Error: ", error);
    }
  } catch (error) {
    console.log("Supabase Calling Error: ", error);
  }
}

export async function storeTextInfo(textInfo) {
  try {
    const textObject = {
      // content: textInfo.content ?? "",
      slug: textInfo.slug,
      url: textInfo.url,
    };

    const { data, error } = await supabase
      .from("ms_text_info")
      .insert(textObject);

    if (error) {
      console.log("Supabase Text Info storing Error: ", error);
    }
  } catch (error) {
    console.log("Supabase Text Info Error: ", error);
  }
}

export async function checkSlug(slug) {
  try {
    const { data, error } = await supabase
      .from("ms_text_info")
      .select("*")
      .eq("slug", slug);

    if (error) {
      console.log("Supabase Slug Checking Internal Error: ", error);
    }

    // console.log("slug Exist: ", data);

    return data;
  } catch (error) {
    console.log("Supabase Slug Checking Error: ", error);
  }
}

export async function checkEmbadding(embadding, slug) {
  try {
    const matchCount = 5;

    const { data, error } = await supabase.rpc("match_documents_by_slug", {
      match_count: matchCount,
      query_embedding: embadding,
      slug_search: slug,
    });

    if (error) {
      console.log("Supabase Embadding Checking Internal Error: ", error);
    }

    // console.log("data is : ", data);

    return data;
  } catch (error) {
    console.log("Supabase Embadding Checking Error: ", error);
  }
}

export async function fetchTest(id) {
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching test:", error);
    throw error;
  }
}

export async function fetchSuites() {
  const { data, error } = await supabase
    .from("suits")
    .select("id, name, testIds, scheduleStart, scheduleEnd")
    .order("name");

  if (error) {
    console.error("Error fetching suites:", error);
    throw error;
  }

  return data || [];
}

export async function updateSuiteSchedule(suiteId, schedules) {
  const { data, error } = await supabase
    .from("suits")
    .update({ schedules: schedules })
    .eq("id", suiteId);

  if (error) {
    console.error("Error updating suite schedule:", error);
    throw error;
  }

  return data;
}

export const fetchScheduledTests = async (startTime, endTime) => {
  const { data, error } = await supabase
    .from("scheduled_tests")
    .select("scheduled_time")
    .gte("scheduled_time", startTime)
    .lt("scheduled_time", endTime)
    .order("scheduled_time", { ascending: true });

  if (error) {
    console.error("Error fetching scheduled tests:", error);
    throw error;
  }

  return data || [];
};

export async function insertScheduledTest(suiteId, scheduledTime) {
  const { data, error } = await supabase
    .from("scheduled_tests")
    .insert({ suite_id: suiteId, scheduled_time: scheduledTime });

  if (error) {
    console.error("Error inserting scheduled test:", error);
    throw error;
  }

  return data;
}

export async function clearScheduledTests() {
  const { data, error } = await supabase
    .from("scheduled_tests")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error clearing scheduled tests:", error);
    throw error;
  }

  console.log("Cleared scheduled tests");
  return data;
}

export async function insertRunHistory(email, testName, runId, associated_workspaceid) {
  try {
    const { data, error } = await supabase
      .from("run_history")
      .insert({
        user_email: email,
        test_name: testName,
        status: "Running",
        started: new Date().toISOString(),
        run_id: runId,
        associated_workspaceid: associated_workspaceid
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error inserting run history:", error);
    throw error;
  }
}

export async function updateRunHistory(id, status, cost) {
  try {
    const { data, error } = await supabase
      .from("run_history")
      .update({
        status: status,
        cost: cost,
        ended: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error updating run history:", error);
    throw error;
  }
}

export async function storeTestRun(testId, testName, status, data, runId) {
  const createdAt = new Date().toISOString();
  try {
    const { data: result, error } = await supabase
      .from("test_runs")
      .insert({
        run_id: runId,
        created_at: createdAt,
        test_id: testId,
        test_name: testName,
        status: status,
        data: data
      })
      .select();

    if (error) {
      console.error("Error storing test run:", error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error("Error in storeTestRun:", error);
    throw error;
  }
}

export async function calculateCredits(myAccountInfo, year) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const monthDashYear = `${currentMonth}-${currentYear}`;

  const lastMonth = Object.keys(myAccountInfo.usage)
    .filter((key) => key.includes("-"))
    .sort()
    .pop();

  if (lastMonth && lastMonth !== monthDashYear) {
    const userUsage = myAccountInfo.usage;
    userUsage[monthDashYear] = {
      browsing_credits: myAccountInfo.plan === "free" ? 5 : 100,
      browsing_credits_used: 0,
    };

    await supabase
      .from("user_details")
      .update({ usage: userUsage })
      .eq("email", myAccountInfo.email);
    return userUsage[monthDashYear].browsing_credits;
  } else {
    const credits =
      myAccountInfo?.usage?.[year]?.browsing_credits -
      myAccountInfo?.usage?.[year]?.browsing_credits_used;
    return credits;
  }
}

export async function updateCreditsByCount(email, creditWillBeDeduct) {
  try {
    const { data, error } = await supabase
      .from("user_details")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "User not found or error fetching user details",
        details: error?.message || "No additional details",
      };
    }

    let myAccountInfoUsage = data?.usage || {};
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthDashYear = `${month}-${year}`;

    if (!myAccountInfoUsage[monthDashYear]) {
      myAccountInfoUsage[monthDashYear] = { browsing_credits_used: 0 };
    }

    myAccountInfoUsage[monthDashYear].browsing_credits_used =
      creditWillBeDeduct +
      myAccountInfoUsage[monthDashYear].browsing_credits_used;

    const response = await supabase
      .from("user_details")
      .update({ usage: myAccountInfoUsage })
      .eq("email", email);

    if (response.error) {
      return {
        success: false,
        error: "Failed to update credits",
        details: response.error.message,
      };
    }

    return {
      success: true,
      data: myAccountInfoUsage,
    };
  } catch (error) {
    return {
      success: false,
      error: "Unexpected error during credit deduction",
      details: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function fetchUserByEmail(email) {
  const { data, error } = await supabase
    .from("user_details")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateTest(id, updateData) {
  try {
    const { data, error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating test:", error);
    throw error;
  }
}

export async function fetchSuitesForRepo(repoFullName) {
  console.log(`🔍 Fetching suites for repo: ${repoFullName}`);
  // Get all suite_ids for this repo from github_app_suites
  const { data: suiteLinks, error: linkError } = await supabase
    .from("github_app_suites")
    .select("suite_id")
    .eq("github_repo", repoFullName);
  if (linkError) {
    console.error("Error fetching github_app_suites:", linkError);
    throw linkError;
  }
  console.log(`📋 Found ${suiteLinks?.length || 0} suite links for repo ${repoFullName}:`, suiteLinks);
  if (!suiteLinks || suiteLinks.length === 0) return [];
  const suiteIds = suiteLinks.map((l) => l.suite_id);
  console.log(`🆔 Suite IDs to fetch:`, suiteIds);
  // Fetch all matching suites
  const { data: suites, error: suiteError } = await supabase
    .from("suits")
    .select("id, name, testIds, email, associated_workspaceid")
    .in("id", suiteIds);
  if (suiteError) {
    console.error("Error fetching suites for repo:", suiteError);
    throw suiteError;
  }
  console.log(`✅ Found ${suites?.length || 0} suites:`, suites);
  return suites || [];
}

export async function fetchRunCostByRunId(runId) {
  try {
    const { data, error } = await supabase
      .from("run_history")
      .select("cost")
      .eq("run_id", runId)
      .single();

    if (error) {
      console.error("Error fetching run cost:", error);
      return 1; // Default to 1 if error
    }

    return data?.cost || 1; // Return cost or default to 1
  } catch (error) {
    console.error("Error in fetchRunCostByRunId:", error);
    return 1; // Default to 1 if error
  }
}

